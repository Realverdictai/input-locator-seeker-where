/**
 * Voice Mediation Session
 * 
 * Two-step process:
 * 1. Upload mediation brief/PLD/evaluation
 * 2. Voice session with animated AI mediator
 */

import { useState } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { Phone, PhoneOff, FileText, Upload, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { CaseData } from '@/types/verdict';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VoiceMediationSessionProps {
  userProfile: UserProfile;
  sessionCode?: string;
  caseData?: Partial<CaseData>;
  onClose: () => void;
  onCaseDataUpdate?: (data: Partial<CaseData>) => void;
}

const AGENT_ID = 'agent_3701k7aj6vrrfqera4zs07ns2x4y';

export function VoiceMediationSession({
  userProfile,
  sessionCode,
  caseData,
  onClose,
  onCaseDataUpdate
}: VoiceMediationSessionProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'session'>('upload');
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadedBrief, setUploadedBrief] = useState<File | null>(null);
  const [briefText, setBriefText] = useState<string>('');
  const [isProcessingBrief, setIsProcessingBrief] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice Mediation] Connected');
      setIsConnected(true);
      toast({
        title: 'Connected to AI Mediator',
        description: 'You can now speak naturally about your case',
        duration: 3000,
      });
    },
    onDisconnect: () => {
      console.log('[Voice Mediation] Disconnected');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('[Voice Mediation] Message:', message);
    },
    onError: (error) => {
      console.error('[Voice Mediation] Error:', error);
      toast({
        title: 'Session Error',
        description: typeof error === 'string' ? error : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleBriefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedBrief(file);
    setIsProcessingBrief(true);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${sessionCode || 'individual'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('case_uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Extract text from the document
      const formData = new FormData();
      formData.append('file', file);

      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'summarize-document',
        {
          body: formData
        }
      );

      if (summaryError) throw summaryError;

      setBriefText(summaryData.summary || '');
      
      // Store in database
      const sessionId = sessionCode || `individual-${userProfile.id}`;
      const { error: dbError } = await supabase
        .from('uploaded_docs')
        .insert({
          case_session_id: sessionId,
          file_name: file.name,
          storage_path: filePath,
          mime_type: file.type,
          text_content: summaryData.summary
        });

      if (dbError) throw dbError;

      toast({
        title: 'Brief uploaded successfully',
        description: 'AI mediator will reference this during your session',
      });
    } catch (error) {
      console.error('[Voice Mediation] Brief upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setUploadedBrief(null);
    } finally {
      setIsProcessingBrief(false);
    }
  };

  const handleProceedToSession = () => {
    if (!uploadedBrief) {
      toast({
        title: 'Brief required',
        description: 'Please upload your mediation brief before starting the session',
        variant: 'destructive',
      });
      return;
    }
    setStep('session');
  };

  const handleStartSession = async () => {
    try {
      // Save case context if available
      if (caseData && Object.keys(caseData).length > 0) {
        const { error } = await supabase
          .from('case_evaluations')
          .insert({
            user_id: userProfile.id,
            case_data: caseData as any
          });

        if (error) console.error('Error saving case context:', error);
      }

      // Get signed URL for ElevenLabs
      const { data, error } = await supabase.functions.invoke('eleven-labs-session', {
        body: { 
          agentId: AGENT_ID,
          sessionContext: {
            userType: userProfile.user_type,
            sessionCode,
            briefText,
            caseData
          }
        }
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      console.log('[Voice Mediation] Starting session...');
      
      const id = await conversation.startSession({ 
        signedUrl: data.signedUrl
      });
      setConversationId(id);
    } catch (error) {
      console.error('[Voice Mediation] Failed to start:', error);
      toast({
        title: 'Failed to start session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleEndSession = async () => {
    try {
      await conversation.endSession();
      
      // Update session status
      if (sessionCode) {
        const { error } = await supabase
          .from('mediation_sessions')
          .update({
            status: 'completed'
          })
          .eq('session_code', sessionCode);

        if (error) console.error('Error updating session:', error);
      }

      setConversationId(null);
      onClose();
    } catch (error) {
      console.error('[Voice Mediation] Failed to end:', error);
    }
  };

  // STEP 1: Upload Brief
  if (step === 'upload') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-2xl">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Prepare for Mediation Session</CardTitle>
            <CardDescription>
              {userProfile.user_type === 'pi_lawyer' ? 'Plaintiff Counsel' : 'Defense Counsel'}
              {sessionCode && ` • Session: ${sessionCode}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center space-y-4">
              <div className="flex justify-center">
                {uploadedBrief ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500 animate-in fade-in" />
                ) : (
                  <FileText className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {uploadedBrief ? 'Brief Uploaded' : 'Upload Your Mediation Brief'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {uploadedBrief 
                    ? `Your brief "${uploadedBrief.name}" has been uploaded and processed. The AI mediator will reference this during your session.`
                    : 'Upload your demand letter, PLD, case evaluation, or mediation brief. The AI will analyze it to facilitate your session.'
                  }
                </p>
              </div>

              {uploadedBrief ? (
                <div className="flex items-center justify-center gap-3 text-sm">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{uploadedBrief.name}</span>
                </div>
              ) : (
                <div>
                  <Label htmlFor="brief-upload">
                    <Button 
                      variant="outline" 
                      disabled={isProcessingBrief}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {isProcessingBrief ? 'Processing...' : 'Choose File'}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="brief-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleBriefUpload}
                    className="hidden"
                    disabled={isProcessingBrief}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: PDF, DOC, DOCX, TXT
                  </p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your brief will be analyzed and embedded into the system</li>
                <li>• The AI mediator will have full context of your case</li>
                <li>• You'll enter a voice session to discuss your position</li>
                <li>• The AI will ask strategic questions and provide insights</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToSession}
                disabled={!uploadedBrief || isProcessingBrief}
                size="lg"
              >
                Proceed to Voice Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 2: Voice Session
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Voice Mediation in Progress</CardTitle>
              <CardDescription>
                {userProfile.user_type === 'pi_lawyer' ? 'Plaintiff Counsel' : 'Defense Counsel'}
                {sessionCode && ` • Session: ${sessionCode}`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              onClick={() => setStep('upload')}
              disabled={isConnected}
            >
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          {/* Animated Mediator */}
          <div className="relative">
            <AnimatedAvatar 
              isSpeaking={conversation.isSpeaking} 
              className="w-64 h-64"
            />
            {isConnected && (
              <div className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium",
                conversation.isSpeaking 
                  ? "bg-blue-500 text-white animate-pulse" 
                  : "bg-green-500 text-white"
              )}>
                {conversation.isSpeaking ? '🗣️ Speaking' : '👂 Listening'}
              </div>
            )}
          </div>

          {/* Mediator Info */}
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-3xl font-bold">Verdict AI Mediator</h3>
            <p className="text-lg text-muted-foreground">
              {!isConnected && 'Ready to begin your mediation session'}
              {isConnected && !conversation.isSpeaking && "I'm listening—speak naturally about your case"}
              {isConnected && conversation.isSpeaking && 'Let me share my thoughts...'}
            </p>
          </div>

          {/* Status Indicator */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
            isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          )}>
            <div className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            )} />
            {isConnected ? 'Session Active' : 'Not Connected'}
          </div>

          {/* Brief Confirmation */}
          {uploadedBrief && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <span className="text-blue-900">
                📄 Mediator has reviewed: <span className="font-semibold">{uploadedBrief.name}</span>
              </span>
            </div>
          )}
        </CardContent>

        {/* Footer Controls */}
        <div className="flex items-center justify-center gap-4 p-6 border-t bg-muted/30">
          {!isConnected ? (
            <Button
              onClick={handleStartSession}
              size="lg"
              className="px-12 h-14 text-lg"
            >
              <Phone className="h-6 w-6 mr-3" />
              Start Voice Session
            </Button>
          ) : (
            <Button
              onClick={handleEndSession}
              variant="destructive"
              size="lg"
              className="px-12 h-14 text-lg"
            >
              <PhoneOff className="h-6 w-6 mr-3" />
              End Session
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}