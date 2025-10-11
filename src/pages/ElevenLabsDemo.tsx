/**
 * ElevenLabs Demo Page
 * 
 * Test page for ElevenLabs conversational AI with animated avatar
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ElevenLabsSessionRoom } from '@/components/ElevenLabsSessionRoom';
import { Video } from 'lucide-react';

export default function ElevenLabsDemo() {
  const [agentId, setAgentId] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleStartSession = () => {
    if (!agentId.trim()) {
      alert('Please enter your ElevenLabs Agent ID');
      return;
    }
    setIsSessionActive(true);
  };

  if (isSessionActive && agentId) {
    return (
      <ElevenLabsSessionRoom
        agentId={agentId}
        onClose={() => setIsSessionActive(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Video className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">ElevenLabs Mediation</h1>
          <p className="text-muted-foreground">
            Enter your ElevenLabs Agent ID to start a voice mediation session
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent ID</label>
            <Input
              placeholder="Your ElevenLabs Agent ID"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartSession();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Get this from your ElevenLabs dashboard
            </p>
          </div>

          <Button
            onClick={handleStartSession}
            className="w-full"
            size="lg"
            disabled={!agentId.trim()}
          >
            Start Session
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Features:</p>
          <ul className="mt-2 space-y-1">
            <li>✓ Real-time voice conversation</li>
            <li>✓ Animated avatar</li>
            <li>✓ Zoom-like interface</li>
            <li>✓ ElevenLabs Conversational AI</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}