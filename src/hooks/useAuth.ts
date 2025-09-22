import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, username, created_at, updated_at')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (error) {
                console.error('Error fetching profile:', error);
              } else if (profileData) {
                setProfile(profileData);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile for existing session
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('id, username, created_at, updated_at')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching profile:', error);
            } else if (profileData) {
              setProfile(profileData);
            }
          } catch (err) {
            console.error('Error in profile fetch:', err);
          }
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    return { error: null };
  };

  const updateLeaderboard = async (gameData: {
    mode: string;
    score: number;
    coins: number;
    games_played: number;
    max_speed_reached: number;
    direction_changes: number;
  }) => {
    if (!profile) return { error: 'No profile found' };

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: profile.id,
          mode: gameData.mode,
          score: Math.max(gameData.score, 0), // Ensure score is never negative
          coins: Math.max(gameData.coins, 0),
          games_played: Math.max(gameData.games_played, 1),
          max_speed_reached: Math.max(gameData.max_speed_reached, 0),
          direction_changes: Math.max(gameData.direction_changes, 0),
        }, {
          onConflict: 'user_id,mode'
        });

      return { data, error };
    } catch (err) {
      console.error('Error updating leaderboard:', err);
      return { error: err };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateLeaderboard,
    isAuthenticated: !!user
  };
};