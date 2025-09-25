import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

interface User extends SupabaseUser {
  profile?: Profile;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAdmin: () => boolean;
  hasProfile: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('Profile fetched:', profile);
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    console.log('Setting up auth state change listener...');

    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state updates
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).then(profile => {
                if (mounted) {
                  console.log('Setting user with profile:', { user: session.user.id, profile: !!profile });
                  setUser({ ...session.user, profile: profile || undefined });
                  setIsLoading(false);
                }
              });
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (!mounted) return;
        
        console.log('Initial session:', session?.user?.id);
        
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            console.log('Initial session - setting user with profile:', { user: session.user.id, profile: !!profile });
            setUser({ ...session.user, profile: profile || undefined });
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        setIsLoading(false);
        // Provide more user-friendly error messages
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email address')) {
          throw new Error('Formato de email inválido.');
        }
        throw error;
      }
      
      // Don't set loading to false here - let the auth state listener handle it
      console.log('Login successful:', data.user?.email);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          },
        },
      });
      
      if (error) {
        setIsLoading(false);
        // Provide more user-friendly error messages
        if (error.message.includes('Email address')) {
          throw new Error('Este formato de email não é válido. Tente um email diferente.');
        } else if (error.message.includes('Password')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        }
        throw error;
      }
      
      // User state will be updated by the auth state listener
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = () => {
    return user?.email === 'culto.demonio.celestial@gmail.com';
  };

  const hasProfile = () => {
    return user?.profile !== undefined;
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profile = await fetchUserProfile(user.id);
    setUser({ ...user, profile: profile || undefined });
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading, isAdmin, hasProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};