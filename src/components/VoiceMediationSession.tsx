/**
 * Voice Mediation Session
 * 
 * Full voice mediation with:
 * - Optional brief upload
 * - ElevenLabs conversational AI
 * - Case data integration
 * - Database access for the AI
 */

import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { Mic, MicOff, Phone, PhoneOff, Upload, FileText, X } from 'lucide-react';
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
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadedBrief, setUploadedBrief] = useState<File | null>(null);
  const [briefText, setBriefText] = useState<string>('');
  const [isProcessingBrief, setIsProcessingBrief] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string; text: string}>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice Mediation] Connected');
      setIsConnected(true);
      toast({
        title: 'Voice session started',
        description: 'You can now speak with Verdict AI',
        duration: 2000,
      });
    },
    onDisconnect: () => {
      console.log('[Voice Mediation] Disconnected');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('[Voice Mediation] Message:', message);
      // Add to transcript if it's a text message
      if (typeof message === 'object' && message !== null) {
        const messageText = JSON.stringify(message);
        setTranscript(prev => [...prev, {
          role: 'assistant',
          text: messageText
        }]);
      }
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
        description: 'The AI can now reference your brief during the session',
      });
    } catch (error) {
      console.error('[Voice Mediation] Brief upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingBrief(false);
    }
  };

  const handleStartSession = async () => {
    try {
      // Save current case data context to database if available
      if (caseData && Object.keys(caseData).length > 0) {
        const { error } = await supabase
          .from('case_evaluations')
          .insert({
            user_id: userProfile.id,
            case_data: caseData as any
          });

        if (error) console.error('Error saving case context:', error);
      }

      // Get signed URL from edge function
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

      console.log('[Voice Mediation] Starting session with context...');
      
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
      
      // Save transcript to database
      if (transcript.length > 0 && sessionCode) {
        const { error } = await supabase
          .from('mediation_sessions')
          .update({
            status: 'completed',
            mediation_proposal: { transcript }
          })
          .eq('session_code', sessionCode);

        if (error) console.error('Error saving transcript:', error);
      }

      setConversationId(null);
      onClose();
    } catch (error) {
      console.error('[Voice Mediation] Failed to end:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Voice Mediation Session</CardTitle>
              <CardDescription>
                {userProfile.user_type === 'pi_lawyer' ? 'Plaintiff Counsel' : 'Defense Counsel'}
                {sessionCode && ` • Session: ${sessionCode}`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndSession}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
          {/* Brief Upload Section (before session starts) */}
          {!isConnected && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="brief-upload" className="cursor-pointer">
                  <div className="text-lg font-medium mb-2">
                    Upload Brief (Optional)
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a demand letter, brief, or medical summary to help the AI understand your case
                  </p>
                  <Input
                    id="brief-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleBriefUpload}
                    className="hidden"
                    disabled={isProcessingBrief}
                  />
                  <Button variant="outline" disabled={isProcessingBrief} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessingBrief ? 'Processing...' : 'Choose File'}
                    </span>
                  </Button>
                </Label>
                {uploadedBrief && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    {uploadedBrief.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voice Session Area */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <AnimatedAvatar 
              isSpeaking={conversation.isSpeaking} 
              className="w-48 h-48"
            />

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">Verdict AI</h3>
              <p className="text-lg text-muted-foreground">
                {conversation.isSpeaking ? 'Speaking...' : isConnected ? 'Listening...' : 'Ready to start'}
              </p>
              {!isConnected && (
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-4">
                  This is your private evaluation session. Speak naturally about your case—Verdict AI will ask strategic questions and help evaluate your position.
                </p>
              )}
            </div>

            <div className={cn(
              'h-3 w-3 rounded-full transition-colors',
              isConnected ? 'bg-green-500' : 'bg-muted'
            )} />
          </div>

          {/* Transcript (shown during session) */}
          {transcript.length > 0 && (
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 className="font-medium mb-2">Transcript</h4>
              <div className="space-y-2">
                {transcript.slice(-5).map((entry, idx) => (
                  <div key={idx} className={cn(
                    "text-sm",
                    entry.role === 'user' ? 'text-blue-600' : 'text-muted-foreground'
                  )}>
                    <span className="font-medium">{entry.role === 'user' ? 'You' : 'AI'}:</span> {entry.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Controls */}
        <div className="flex items-center justify-center gap-4 p-6 border-t">
          {!isConnected ? (
            <Button
              onClick={handleStartSession}
              size="lg"
              className="px-8"
            >
              <Phone className="h-5 w-5 mr-2" />
              Start Voice Session
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                disabled
                className="px-8"
              >
                {conversation.status === 'connected' ? (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Mic Active
                  </>
                ) : (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
                    Mic Inactive
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleEndSession}
                variant="destructive"
                size="lg"
                className="px-8"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Session
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
