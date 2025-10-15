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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceMediationSessionProps {
  userProfile: UserProfile;
  sessionCode?: string; // Optional now
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
  const [isProcessingBrief, setIsProcessingBrief] = useState(false);
  const [conversationOverrides, setConversationOverrides] = useState<any | null>(null);

  // Session state
  const [partyEmail, setPartyEmail] = useState<string>(userProfile.company_name || '');
  const [side, setSide] = useState<'plaintiff' | 'defense'>(userProfile.user_type === 'pi_lawyer' ? 'plaintiff' : 'defense');
  const [briefFilename, setBriefFilename] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; ts: number }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Voice Mediation] Connected');
      setIsConnected(true);
      toast({
        title: 'Connected to Judge Iskandar',
        description: 'Judge Iskander has reviewed your brief and is ready to mediate',
        duration: 4000,
      });
    },
    onDisconnect: () => {
      console.log('[Voice Mediation] Disconnected - checking if unexpected...');
      setIsConnected(false);
      
      // If we have a conversation ID but disconnected unexpectedly, notify user
      if (conversationId) {
        console.error('[Voice Mediation] Unexpected disconnect during active session');
        toast({
          title: 'Session Disconnected',
          description: 'The connection was lost. Please check your internet connection and try again.',
          variant: 'destructive',
          duration: 6000,
        });
      }
    },
    onMessage: (message) => {
      console.log('[Voice Mediation] Message:', message);
      
      // Collect transcript for final messages
      if (message && typeof message === 'object' && 'message' in message) {
        const text = message.message;
        const role = message.source || 'unknown';
        if (text) {
          setTranscript(prev => [...prev, { role, text, ts: Date.now() }]);
        }
      }
    },
    onError: (error) => {
      console.error('[Voice Mediation] Error:', error);
      
      // Log detailed error information
      const errorDetails = typeof error === 'object' ? JSON.stringify(error) : String(error);
      console.error('[Voice Mediation] Full error details:', errorDetails);
      
      toast({
        title: 'Session Error',
        description: typeof error === 'string' ? error : 'Connection error - please try reconnecting',
        variant: 'destructive',
        duration: 6000,
      });
      
      // If critical error, reset state
      if (errorDetails.includes('WebSocket') || errorDetails.includes('connection')) {
        setIsConnected(false);
        setConversationId(null);
      }
    },
  });

  const handleBriefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!partyEmail || !side) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in party email and select a side first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingBrief(true);
    setBriefFilename(file.name);

    try {
      // Step 1: Extract text using upload-docs
      const newSessionId = `one_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const uploadFormData = new FormData();
      uploadFormData.append('caseSessionId', newSessionId);
      uploadFormData.append('files', file);

      console.log('[Brief Upload] Calling upload-docs to extract text...');
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-docs', {
        body: uploadFormData
      });

      if (uploadError || !uploadData?.ok) {
        throw new Error(uploadError?.message || 'Failed to extract document text');
      }

      const extractedText = uploadData.files?.[0]?.textContent || '';
      console.log('[Brief Upload] Extracted text length:', extractedText.length);

      if (!extractedText) {
        throw new Error('No text could be extracted from the document');
      }

      // Step 2: Store in briefs_one_side table
      const { error: insertError } = await supabase
        .from('briefs_one_side')
        .insert({
          session_id: newSessionId,
          party_email: partyEmail,
          side: side,
          filename: file.name,
          brief_text: extractedText
        });

      if (insertError) {
        console.error('[Brief Upload] Insert error:', insertError);
        throw new Error('Failed to save brief: ' + insertError.message);
      }

      setSessionId(newSessionId);
      console.log('[Brief Upload] Brief saved with sessionId:', newSessionId);

      toast({
        title: 'Brief uploaded ✓',
        description: 'Starting session with Judge Iskander...',
      });

      // Step 3: Start ElevenLabs session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('elevenlabs-start-session', {
        body: { sessionId: newSessionId }
      });

      if (sessionError || !sessionData?.ok) {
        throw new Error(sessionError?.message || sessionData?.error || 'Failed to start session');
      }

      const { signedUrl, firstMessage, systemPrompt } = sessionData;

      console.log('[Voice Mediation] Starting session with overrides...', {
        firstMessagePreview: firstMessage.substring(0, 100),
        systemPromptPreview: systemPrompt.substring(0, 100)
      });
      
      // Pass overrides directly to startSession
      const id = await conversation.startSession({ 
        signedUrl: signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: systemPrompt
            },
            firstMessage: firstMessage,
            language: 'en'
          }
        }
      });
      setConversationId(id);
      
      console.log('[Voice Mediation] Session started successfully:', {
        conversationId: id,
        sessionId: newSessionId
      });

      toast({
        title: 'Session Started',
        description: 'Judge Iskander has reviewed your brief and is ready to mediate',
      });

    } catch (error) {
      console.error('[Voice Mediation] Error:', error);
      toast({
        title: 'Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setBriefFilename(null);
      setSessionId(null);
    } finally {
      setIsProcessingBrief(false);
    }
  };

  const handleEndSession = async () => {
    try {
      console.log('[Voice Mediation] Ending session gracefully...');
      await conversation.endSession();
      
      // Note: For one-sided sessions, we don't update mediation_sessions table
      // The session data is tracked in briefs_one_side and transcript state
      
      console.log('[Voice Mediation] Session ended. Transcript entries:', transcript.length);

      setConversationId(null);
      setIsConnected(false);
      
      toast({
        title: 'Session Ended',
        description: `Your mediation session has been saved with ${transcript.length} exchanges.`,
      });
      
      onClose();
    } catch (error) {
      console.error('[Voice Mediation] Failed to end session:', error);
      // Still close even if there's an error
      setConversationId(null);
      setIsConnected(false);
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-5xl flex flex-col shadow-2xl overflow-y-auto max-h-[90vh]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Voice Mediation Session</CardTitle>
              <CardDescription>
                {userProfile.user_type === 'pi_lawyer' ? 'Plaintiff Counsel' : 'Defense Counsel'}
              </CardDescription>
            </div>
          </div>

          {/* Brief Upload Panel */}
          {!isConnected && (
            <div className="mt-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="text-sm font-semibold mb-3">Upload Brief to Start Session</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="party-email" className="text-xs">Party Email *</Label>
                  <Input
                    id="party-email"
                    type="email"
                    placeholder="party@example.com"
                    value={partyEmail}
                    onChange={(e) => setPartyEmail(e.target.value)}
                    required
                    disabled={isProcessingBrief}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="side" className="text-xs">Side *</Label>
                  <Select value={side} onValueChange={(val) => setSide(val as 'plaintiff' | 'defense')} disabled={isProcessingBrief}>
                    <SelectTrigger id="side">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plaintiff">Plaintiff</SelectItem>
                      <SelectItem value="defense">Defense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief-upload" className="text-xs">Mediation Brief (PDF, DOC, DOCX)</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="brief-upload">
                    <Button 
                      variant="outline" 
                      disabled={isProcessingBrief || !partyEmail || !side}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {isProcessingBrief ? 'Starting Session...' : 'Upload Brief & Start'}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="brief-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleBriefUpload}
                    className="hidden"
                    disabled={isProcessingBrief || !partyEmail || !side}
                  />
                  {briefFilename && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{briefFilename}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
            <h3 className="text-3xl font-bold">Judge William Iskandar</h3>
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

          {/* Brief Status Indicator */}
          {briefFilename && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Brief: {briefFilename}</p>
                  <p className="text-green-700">Judge Iskander is using this brief to guide the mediation</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Controls */}
        <div className="flex items-center justify-center gap-4 p-6 border-t bg-muted/30">
          {isConnected ? (
            <Button
              onClick={handleEndSession}
              variant="destructive"
              size="lg"
              className="px-8 h-12"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Finish Session
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              size="lg"
              className="px-8 h-12"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}