
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MediationSession } from "@/types/mediation";
import { UserProfile } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";

interface MediationDashboardProps {
  userProfile: UserProfile;
  onStartEvaluation: (sessionCode?: string) => void;
}

const MediationDashboard = ({ userProfile, onStartEvaluation }: MediationDashboardProps) => {
  const [sessions, setSessions] = useState<MediationSession[]>([]);
  const [newSessionCode, setNewSessionCode] = useState('');
  const [joinSessionCode, setJoinSessionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediationSessions();
  }, []);

  const fetchMediationSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('mediation_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []) as MediationSession[]);
    } catch (error: any) {
      toast({
        title: "Error fetching sessions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createMediationSession = async () => {
    if (!newSessionCode.trim()) {
      toast({
        title: "Please enter a session code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionData: any = {
        session_code: newSessionCode,
        status: 'pending'
      };

      if (userProfile.user_type === 'pi_lawyer') {
        sessionData.pi_lawyer_id = userProfile.id;
      } else {
        sessionData.insurance_id = userProfile.id;
      }

      const { data, error } = await supabase
        .from('mediation_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Mediation session created!",
        description: `Session code: ${newSessionCode}`
      });

      setNewSessionCode('');
      fetchMediationSessions();
      onStartEvaluation(newSessionCode);
    } catch (error: any) {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinMediationSession = async () => {
    if (!joinSessionCode.trim()) {
      toast({
        title: "Please enter a session code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Looking for session with code:', joinSessionCode);
      
      const { data: session, error: fetchError } = await supabase
        .from('mediation_sessions')
        .select('*')
        .eq('session_code', joinSessionCode)
        .single();

      if (fetchError) {
        console.error('Session fetch error:', fetchError);
        throw new Error('Session not found');
      }

      console.log('Found session:', session);
      console.log('User profile:', userProfile);

      // Check if user can join this session
      const updateData: any = {};
      let canJoin = false;

      if (userProfile.user_type === 'pi_lawyer') {
        if (!session.pi_lawyer_id) {
          updateData.pi_lawyer_id = userProfile.id;
          canJoin = true;
        } else if (session.pi_lawyer_id === userProfile.id) {
          // User is already in this session
          canJoin = true;
        }
      } else if (userProfile.user_type === 'insurance_defense') {
        if (!session.insurance_id) {
          updateData.insurance_id = userProfile.id;
          canJoin = true;
        } else if (session.insurance_id === userProfile.id) {
          // User is already in this session
          canJoin = true;
        }
      }

      if (!canJoin) {
        throw new Error('Cannot join this session - slot already filled or invalid user type');
      }

      // Only update if there are changes to make
      if (Object.keys(updateData).length > 0) {
        console.log('Updating session with:', updateData);
        
        const { error: updateError } = await supabase
          .from('mediation_sessions')
          .update(updateData)
          .eq('id', session.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      }

      toast({
        title: "Joined mediation session!",
        description: `Session code: ${joinSessionCode}`
      });

      setJoinSessionCode('');
      fetchMediationSessions();
      onStartEvaluation(joinSessionCode);
    } catch (error: any) {
      console.error('Join session error:', error);
      toast({
        title: "Error joining session",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Mediation Dashboard</h2>
        <p className="text-gray-600">
          Welcome, {userProfile.user_type === 'pi_lawyer' ? 'PI Lawyer' : 'Insurance/Defense Counsel'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Session
            </CardTitle>
            <CardDescription>
              Start a new mediation session with a unique code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-session-code">Session Code</Label>
              <Input
                id="new-session-code"
                value={newSessionCode}
                onChange={(e) => setNewSessionCode(e.target.value)}
                placeholder="Enter unique session code"
              />
            </div>
            <Button onClick={createMediationSession} disabled={isLoading} className="w-full">
              Create Session & Start Evaluation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Join Existing Session
            </CardTitle>
            <CardDescription>
              Join a mediation session using the session code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-session-code">Session Code</Label>
              <Input
                id="join-session-code"
                value={joinSessionCode}
                onChange={(e) => setJoinSessionCode(e.target.value)}
                placeholder="Enter session code to join"
              />
            </div>
            <Button onClick={joinMediationSession} disabled={isLoading} className="w-full">
              Join Session & Start Evaluation
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Mediation Sessions</CardTitle>
          <CardDescription>
            View and manage your active mediation sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No mediation sessions yet. Create or join one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Session: {session.session_code}</h3>
                    <p className="text-sm text-gray-600">Status: {session.status}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => onStartEvaluation(session.session_code)}
                  >
                    Continue Evaluation
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Case Evaluation</CardTitle>
          <CardDescription>
            Evaluate a case without mediation session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onStartEvaluation()} className="w-full">
            Start Individual Evaluation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediationDashboard;
