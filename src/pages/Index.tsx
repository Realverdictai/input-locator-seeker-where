import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CaseInputForm from "@/components/CaseInputForm";
import VerdictResults from "@/components/VerdictResults";
import AuthForm from "@/components/AuthForm";
import MediationDashboard from "@/components/MediationDashboard";
import { CaseData, VerdictEstimate } from "@/types/verdict";
import { evaluateCase } from "@/lib/verdictCalculator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Scale, Brain, Shield, Users, TrendingUp } from "lucide-react";

const Index = () => {
  console.log("Index component rendering");
  
  const { user, userProfile, loading, signOut } = useAuth();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [verdictEstimate, setVerdictEstimate] = useState<VerdictEstimate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const { toast } = useToast();

  const handleAuthSuccess = () => {
    // User will be automatically set by the auth hook
  };

  const handleStartEvaluation = (sessionCode?: string) => {
    setCurrentSessionCode(sessionCode || null);
    setShowEvaluation(true);
  };

  const handleBackToDashboard = () => {
    setShowEvaluation(false);
    setCaseData(null);
    setVerdictEstimate(null);
    setCurrentSessionCode(null);
  };

  const handleCaseSubmit = async (data: CaseData) => {
    console.log("Case submitted:", data);
    setIsEvaluating(true);
    setCaseData(data);
    
    // Simulate evaluation processing time
    setTimeout(async () => {
      try {
        const estimate = evaluateCase(data);
        console.log("Evaluation complete:", estimate);
        setVerdictEstimate(estimate);
        
        // Save case evaluation to database
        if (user) {
          const { error } = await supabase
            .from('case_evaluations')
            .insert({
              user_id: user.id,
              case_data: data as any
            });

          if (error) {
            console.error('Error saving case evaluation:', error);
          }

          // If this is part of a mediation session, update the session
          if (currentSessionCode) {
            await updateMediationSession(data, estimate);
          }
        }
        
        setIsEvaluating(false);
      } catch (error) {
        console.error("Error evaluating case:", error);
        setIsEvaluating(false);
      }
    }, 2000);
  };

  const updateMediationSession = async (caseData: CaseData, estimate: VerdictEstimate) => {
    try {
      // Get the current session
      const { data: session, error: fetchError } = await supabase
        .from('mediation_sessions')
        .select('*')
        .eq('session_code', currentSessionCode)
        .single();

      if (fetchError) throw fetchError;

      // Get the latest case evaluation ID
      const { data: evaluation, error: evalError } = await supabase
        .from('case_evaluations')
        .select('id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (evalError) throw evalError;

      // Update session with evaluation ID
      const updateData: any = {};
      if (userProfile?.user_type === 'pi_lawyer') {
        updateData.pi_evaluation_id = evaluation.id;
      } else {
        updateData.insurance_evaluation_id = evaluation.id;
      }

      const { error: updateError } = await supabase
        .from('mediation_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) throw updateError;

      // Check if both parties have submitted and generate mediation proposal
      const updatedSession = { ...session, ...updateData };
      if (updatedSession.pi_evaluation_id && updatedSession.insurance_evaluation_id) {
        await generateMediationProposal(updatedSession);
      }

    } catch (error) {
      console.error('Error updating mediation session:', error);
    }
  };

  const generateMediationProposal = async (session: any) => {
    try {
      console.log('Generating mediation proposal for session:', session.id);
      
      const { data, error } = await supabase.functions.invoke('send-mediation-proposal', {
        body: {
          sessionId: session.id,
          piEvaluationId: session.pi_evaluation_id,
          insuranceEvaluationId: session.insurance_evaluation_id
        }
      });

      if (error) {
        console.error('Error calling mediation proposal function:', error);
        throw error;
      }

      console.log('Mediation proposal response:', data);

      toast({
        title: "Mediation Proposal Generated!",
        description: "Both parties have submitted their evaluations. A mediation proposal has been generated and sent to all parties.",
      });
    } catch (error) {
      console.error('Error generating mediation proposal:', error);
      toast({
        title: "Error",
        description: "Failed to generate mediation proposal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setCaseData(null);
    setVerdictEstimate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-purple-500/30 border-t-purple-400 rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping w-16 h-16 border-4 border-purple-400/20 rounded-full mx-auto"></div>
          </div>
          <p className="text-white/90 text-lg font-medium">Initializing Verdict AI...</p>
          <div className="flex items-center justify-center mt-3 space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (!showEvaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\" fill=\"%23ffffff\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-12">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                    Verdict AI
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300 font-medium">Legal Intelligence Platform</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{userProfile.company_name}</p>
                    <p className="text-purple-200 text-sm">
                      {userProfile.user_type === 'pi_lawyer' ? 'Personal Injury Lawyer' : 'Insurance & Defense Counsel'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={signOut} 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Sign Out
            </Button>
          </div>
          
          <MediationDashboard 
            userProfile={userProfile} 
            onStartEvaluation={handleStartEvaluation}
          />
        </div>
      </div>
    );
  }

  console.log("Rendering Index with state:", { caseData: !!caseData, verdictEstimate: !!verdictEstimate, isEvaluating });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\" fill=\"%23ffffff\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  Verdict AI
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Case Evaluation Engine</span>
                </div>
              </div>
            </div>
            
            {currentSessionCode && (
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm p-4 rounded-xl border border-blue-400/30">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-300" />
                  <div>
                    <p className="text-blue-200 font-medium">Active Mediation Session</p>
                    <p className="text-blue-100 text-sm font-mono">{currentSessionCode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleBackToDashboard} 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline"
              className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
                      Comprehensive Case Analysis
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-300 text-xs font-medium">AI-Powered</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Enter detailed case information for accurate evaluation including medical, economic, and legal factors
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                <CaseInputForm onSubmit={handleCaseSubmit} isLoading={isEvaluating} />
                {verdictEstimate && (
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Evaluate New Case
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                      Advanced Evaluation Results
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.5s]"></div>
                      <span className="text-indigo-300 text-xs font-medium">Neural Analysis</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  AI-powered comprehensive verdict and settlement analysis with predictive modeling
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                {!verdictEstimate && !isEvaluating && (
                  <div className="text-center py-16 text-gray-300">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto border border-purple-400/30 backdrop-blur-sm">
                        <TrendingUp className="w-10 h-10 text-purple-300" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready for Analysis</h3>
                    <p className="text-purple-200 max-w-sm mx-auto">
                      Complete the comprehensive case information to receive your detailed AI-powered evaluation
                    </p>
                  </div>
                )}
                
                {isEvaluating && (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto">
                        <div className="absolute inset-0 animate-spin w-20 h-20 border-4 border-purple-500/30 border-t-purple-400 rounded-full"></div>
                        <div className="absolute inset-2 animate-pulse w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 text-purple-300" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">AI Analysis in Progress</h3>
                    <p className="text-purple-200 mb-4">Processing comprehensive case data and generating detailed estimates...</p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-purple-300">
                        <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                        Analyzing medical records, legal factors, and insurance coverage...
                      </p>
                    </div>
                  </div>
                )}

                {verdictEstimate && <VerdictResults estimate={verdictEstimate} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
