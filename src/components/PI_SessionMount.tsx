/**
 * PI Session Mount Component
 * 
 * Conditionally renders a voice session UI when mediatorOverlay feature is enabled.
 * Integrates MediatorSessionRoom with Judge Iskander session brain.
 * 
 * Usage (manual, demo only):
 * import { PI_SessionMount } from '@/components/PI_SessionMount';
 * <PI_SessionMount />
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MediatorSessionRoom } from '@/components/MediatorSessionRoom';
import { startPiSession, type JudgeIskanderSessionBrain } from '@/agents/judgeIskander/session_brain';
import { getCurrentPiStepId } from '@/mediator/pi_step_adapters';
import { getFeatureFlags } from '@/lib/featureFlags';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PI_SessionMount() {
  const [features, setFeatures] = useState(getFeatureFlags());
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionBrain, setSessionBrain] = useState<JudgeIskanderSessionBrain | null>(null);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'user' | 'assistant'; text: string }>>([]);
  const [currentPartial, setCurrentPartial] = useState<string>('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const { toast } = useToast();

  // Listen for feature flag changes
  useEffect(() => {
    const handleStorageChange = () => {
      setFeatures(getFeatureFlags());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes (in case same tab updates flags)
    const interval = setInterval(() => {
      const newFlags = getFeatureFlags();
      if (newFlags.mediatorOverlay !== features.mediatorOverlay) {
        setFeatures(newFlags);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [features.mediatorOverlay]);

  // Don't render anything if feature is disabled
  if (!features.mediatorOverlay) {
    return null;
  }

  const handleStartSession = async () => {
    try {
      console.log('[PI Session Mount] Starting session...');
      
      const currentStep = getCurrentPiStepId();
      
      const brain = await startPiSession({
        stepHint: currentStep,
        onPartial: (text, speaker) => {
          console.log('[PI Session Mount] Partial:', speaker, text.substring(0, 50));
          setCurrentPartial(text);
          if (speaker === 'assistant') {
            setIsAgentSpeaking(true);
          }
        },
        onFinal: (text, speaker) => {
          console.log('[PI Session Mount] Final:', speaker, text.substring(0, 50));
          setTranscript(prev => [...prev, { speaker, text }]);
          setCurrentPartial('');
          setIsAgentSpeaking(false);
        },
        onToolCall: (toolName, args, result) => {
          console.log('[PI Session Mount] Tool call:', toolName, result.ok ? 'success' : 'failed');
          
          // Show toast for important tool calls
          if (toolName === 'update_field' && result.ok) {
            toast({
              title: 'Field Updated',
              description: `Updated ${args.path}`,
              duration: 2000,
            });
          } else if (toolName === 'advance_step' && result.ok) {
            toast({
              title: 'Step Advanced',
              description: 'Moving to next step',
              duration: 3000,
            });
          }
        },
        onStepChange: (oldStep, newStep) => {
          console.log('[PI Session Mount] Step change:', oldStep, '→', newStep);
          toast({
            title: 'Step Changed',
            description: `Now on: ${newStep}`,
            duration: 3000,
          });
        },
        onError: (error) => {
          console.error('[PI Session Mount] Session error:', error);
          toast({
            title: 'Session Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      });

      setSessionBrain(brain);
      setIsSessionActive(true);

      toast({
        title: 'Session Started',
        description: 'Judge Iskander is ready',
        duration: 2000,
      });

    } catch (error) {
      console.error('[PI Session Mount] Failed to start session:', error);
      toast({
        title: 'Failed to Start',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleEndSession = () => {
    if (sessionBrain) {
      sessionBrain.stop();
      setSessionBrain(null);
    }
    setIsSessionActive(false);
    setTranscript([]);
    setCurrentPartial('');
    setIsAgentSpeaking(false);

    toast({
      title: 'Session Ended',
      description: 'Judge Iskander session closed',
      duration: 2000,
    });
  };

  // If session is not active, show start button
  if (!isSessionActive) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleStartSession}
          className="flex items-center gap-2 shadow-lg"
          size="sm"
        >
          <Mic className="h-4 w-4" />
          Start Session
        </Button>
      </div>
    );
  }

  // If session is active, show MediatorSessionRoom
  return (
    <MediatorSessionRoom
      route="pi"
      stepId={getCurrentPiStepId()}
      onClose={handleEndSession}
      modelPurpose="pi_reasoning"
      transcript={transcript.map(t => ({
        speaker: t.speaker === 'user' ? 'User' : 'Judge Iskander',
        text: t.text,
        timestamp: new Date().toLocaleTimeString()
      }))}
      notes={sessionBrain?.getToolCalls().map(tc => 
        `${tc.tool}: ${tc.result.ok ? 'success' : 'failed'}`
      ) || []}
      isAgentSpeaking={isAgentSpeaking}
    />
  );
}
