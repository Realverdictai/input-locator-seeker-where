
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CaseInputForm from "@/components/CaseInputForm";
import VerdictResults from "@/components/VerdictResults";
import AuthForm from "@/components/AuthForm";
import MediationDashboard from "@/components/MediationDashboard";
import { CaseData, VerdictEstimate } from "@/types/verdict";
import { calcEvaluatorAI } from "@/valuation/calcEvaluatorAI";
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
  const [narrativeText, setNarrativeText] = useState('');
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

    setTimeout(async () => {
      try {
        const aiResult = await calcEvaluatorAI(data, narrativeText);
        const evalNum = parseFloat(aiResult.evaluatorNet.replace(/[$,]/g, ''));
        const converted: VerdictEstimate = {
          lowVerdict: Math.round(evalNum * 0.9),
          midVerdict: Math.round(evalNum),
          highVerdict: Math.round(evalNum * 1.1),
          settlementRangeLow: Math.round(evalNum * 0.8),
          settlementRangeHigh: Math.round(evalNum * 1.2),
          policyExceedanceChance: 0,
          rationale: aiResult.rationale,
          casesEvaluated: 1,
          isFreeModel: false
        };
        console.log("Evaluation complete:", converted);
        setVerdictEstimate(converted);
        
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
            await updateMediationSession(data, converted);
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
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (!showEvaluation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Verdict AI
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 font-medium">Legal Intelligence Platform</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{userProfile.company_name}</p>
                    <p className="text-gray-600 text-sm">
                      {userProfile.user_type === 'pi_lawyer' ? 'Personal Injury Lawyer' : 'Insurance & Defense Counsel'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={signOut} 
              variant="outline" 
              className="hover:bg-gray-100"
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Verdict AI
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600 font-medium">Case Evaluation Engine</span>
                </div>
              </div>
            </div>
            
            {currentSessionCode && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-blue-800 font-medium">Active Mediation Session</p>
                    <p className="text-blue-600 text-sm font-mono">{currentSessionCode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleBackToDashboard} 
              variant="outline"
              className="hover:bg-gray-100"
            >
              Dashboard
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-green-600 rounded-lg shadow-lg">
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span>
                      Comprehensive Case Analysis
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 text-xs font-medium">AI-Powered</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter detailed case information for accurate evaluation including medical, economic, and legal factors
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                <CaseInputForm
                  onSubmit={handleCaseSubmit}
                  isLoading={isEvaluating}
                  allowDocumentUpload={userProfile.user_type === 'pi_lawyer' || userProfile.user_type === 'insurance_defense'}
                  onNarrativeChange={setNarrativeText}
                />
                {verdictEstimate && (
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full mt-4 hover:bg-gray-100"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Evaluate New Case
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-purple-600 rounded-lg shadow-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span>
                      Advanced Evaluation Results
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-600 text-xs font-medium">Neural Analysis</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  AI-powered comprehensive verdict and settlement analysis with predictive modeling
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                {!verdictEstimate && !isEvaluating && (
                  <div className="text-center py-16 text-gray-500">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto border border-gray-200">
                        <TrendingUp className="w-10 h-10 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
                    <p className="text-gray-600 max-w-sm mx-auto">
                      Complete the comprehensive case information to receive your detailed AI-powered evaluation
                    </p>
                  </div>
                )}
                
                {isEvaluating && (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto">
                        <div className="absolute inset-0 animate-spin w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                        <div className="absolute inset-2 w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis in Progress</h3>
                    <p className="text-gray-600 mb-4">Processing comprehensive case data and generating detailed estimates...</p>
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Analyzing medical records, legal factors, and insurance coverage...
                      </p>
                    </div>
                  </div>
                )}

                {verdictEstimate && (
                  <VerdictResults 
                    estimate={verdictEstimate} 
                    policyLimits={caseData?.policyLimits}
                    mediatorProposal={caseData?.policyLimits ? Math.round((verdictEstimate.settlementRangeLow + verdictEstimate.settlementRangeHigh) / 2) : undefined}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
