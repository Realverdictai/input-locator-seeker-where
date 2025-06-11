
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session retrieved:', session?.user?.id || 'No session');
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id || 'No user');
      setUser(session?.user ?? null);
      
      if (session?.user && event !== 'TOKEN_REFRESHED') {
        // Use setTimeout to avoid potential recursion issues
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 100);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // Add retry logic for database connectivity issues
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data

          if (error) {
            console.error('Error fetching user profile:', error);
            lastError = error;
            retries--;
            if (retries > 0) {
              console.log(`Retrying profile fetch... ${retries} attempts remaining`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else {
            console.log('User profile fetched:', data);
            setUserProfile(data);
            return;
          }
        } catch (fetchError) {
          console.error('Unexpected error in profile fetch:', fetchError);
          lastError = fetchError;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If we get here, all retries failed
      console.error('All profile fetch attempts failed. Last error:', lastError);
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('Successfully signed out');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Unexpected error signing out:', error);
    }
  };

  return {
    user,
    userProfile,
    loading,
    signOut
  };
};
