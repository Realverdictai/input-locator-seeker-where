/**
 * ElevenLabs Demo Page
 * 
 * Test page for ElevenLabs voice mediation with proper context
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ElevenLabsSessionRoom } from '@/components/ElevenLabsSessionRoom';
import { useAuth } from '@/hooks/useAuth';
import { Video } from 'lucide-react';

export default function ElevenLabsDemo() {
  const [agentId, setAgentId] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

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
        userProfile={userProfile}
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
          <h1 className="text-3xl font-bold">Voice Mediation Demo</h1>
          <p className="text-muted-foreground">
            Test voice mediation as {userProfile.user_type === 'pi_lawyer' ? 'plaintiff counsel' : 'defense counsel'}
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
              Get this from your ElevenLabs dashboard. Configure your agent to speak to experienced {userProfile.user_type === 'pi_lawyer' ? 'plaintiff' : 'defense'} counsel.
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
          <p className="font-medium mb-2">Asynchronous Mediation:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>✓ Each party evaluates separately</li>
            <li>✓ Professional peer-to-peer dialogue</li>
            <li>✓ Real-time voice conversation</li>
            <li>✓ Strategic case evaluation</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}