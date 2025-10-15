/**
 * ElevenLabs Voice Mediation Session
 * 
 * Professional voice interface for asynchronous mediation.
 * Each party (PI lawyer or insurance adjuster) completes their evaluation separately.
 * The AI speaks as an experienced neutral mediator to seasoned professionals.
 */

import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

interface ElevenLabsSessionRoomProps {
  agentId: string;
  userProfile: UserProfile;
  sessionCode?: string;
  onClose: () => void;
  className?: string;
}

export function ElevenLabsSessionRoom({
  agentId,
  userProfile,
  sessionCode,
  onClose,
  className
}: ElevenLabsSessionRoomProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs Room] Connected');
      setIsConnected(true);
      toast({
        title: 'Connected',
        description: 'Voice mediation session started',
        duration: 2000,
      });
    },
    onDisconnect: () => {
      console.log('[ElevenLabs Room] Disconnected');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('[ElevenLabs Room] Message:', message);
    },
    onError: (error) => {
      console.error('[ElevenLabs Room] Error:', error);
      toast({
        title: 'Session Error',
        description: typeof error === 'string' ? error : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleStartSession = async () => {
    try {
      console.log('[ElevenLabs Room] Starting session with sessionCode:', sessionCode);
      
      // Get signed URL from our edge function with sessionId
      const { data, error } = await supabase.functions.invoke('eleven-labs-session', {
        body: { 
          agentId,
          sessionId: sessionCode || 'no-session', // Pass sessionId for dynamic variables
          sessionContext: {
            sessionCode: sessionCode || 'no-session',
            hasBrief: !!sessionCode
          }
        }
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      console.log('[ElevenLabs Room] Got signed URL, starting session with sessionId:', sessionCode);
      setSignedUrl(data.signedUrl);

      // Start the conversation
      const id = await conversation.startSession({ 
        signedUrl: data.signedUrl
      });
      setConversationId(id);
    } catch (error) {
      console.error('[ElevenLabs Room] Failed to start:', error);
      toast({
        title: 'Failed to Start',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleEndSession = async () => {
    try {
      await conversation.endSession();
      setConversationId(null);
      onClose();
    } catch (error) {
      console.error('[ElevenLabs Room] Failed to end:', error);
    }
  };

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm',
      'flex items-center justify-center p-4',
      className
    )}>
      <Card className="w-full max-w-4xl h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Voice Mediation Session</h2>
            <p className="text-sm text-muted-foreground">
              {userProfile.user_type === 'pi_lawyer' ? 'Plaintiff Counsel' : 'Defense Counsel'}
              {sessionCode && ` • Session: ${sessionCode}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndSession}
            className="text-destructive hover:text-destructive"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          {/* Avatar */}
          <AnimatedAvatar 
            isSpeaking={conversation.isSpeaking} 
            className="w-64 h-64"
          />

          {/* Status */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Verdict AI</h3>
            <p className="text-lg text-muted-foreground">
              {conversation.isSpeaking ? 'Speaking...' : 'Listening...'}
            </p>
            {!isConnected && (
              <p className="text-sm text-muted-foreground max-w-md">
                This is your private evaluation session. The other party will complete their evaluation separately. 
                Speak naturally about your case—Verdict AI understands you're an experienced professional.
              </p>
            )}
          </div>

          {/* Connection status indicator */}
          <div className={cn(
            'h-3 w-3 rounded-full transition-colors',
            isConnected ? 'bg-green-500' : 'bg-destructive'
          )} />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-center gap-4 p-6 border-t">
          {!isConnected ? (
            <Button
              onClick={handleStartSession}
              size="lg"
              className="flex items-center gap-2 px-8"
            >
              <Phone className="h-5 w-5" />
              Start Session
            </Button>
          ) : (
            <>
              <Button
                variant={conversation.status === 'connected' ? 'default' : 'outline'}
                size="lg"
                className="flex items-center gap-2 px-8"
                disabled
              >
                {conversation.status === 'connected' ? (
                  <>
                    <Mic className="h-5 w-5" />
                    Mic Active
                  </>
                ) : (
                  <>
                    <MicOff className="h-5 w-5" />
                    Mic Inactive
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleEndSession}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2 px-8"
              >
                <PhoneOff className="h-5 w-5" />
                End Session
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}