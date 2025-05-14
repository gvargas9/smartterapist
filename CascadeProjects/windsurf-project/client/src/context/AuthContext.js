import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { supabaseService } from '../services/supabaseService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check for development mode - multiple ways to detect it
        // First check our custom key
        const mockUserStr = localStorage.getItem('smarttherapist_mock_user');
        if (mockUserStr) {
          try {
            const mockUser = JSON.parse(mockUserStr);
            console.log('🔧 Development mode: Using mock user from custom key', mockUser);
            setUser(mockUser);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing mock user from custom key:', e);
            localStorage.removeItem('smarttherapist_mock_user');
          }
        }
        
        // Then check Supabase key
        const supabaseAuthStr = localStorage.getItem('sb-nvrvldvrqxlhcebxqowk-auth-token');
        if (supabaseAuthStr) {
          try {
            const supabaseAuth = JSON.parse(supabaseAuthStr);
            if (supabaseAuth.currentSession && supabaseAuth.currentSession.user) {
              const mockUser = supabaseAuth.currentSession.user;
              console.log('🔧 Development mode: Using mock user from Supabase key', mockUser);
              
              // Also store in our custom key for redundancy
              localStorage.setItem('smarttherapist_mock_user', JSON.stringify(mockUser));
              
              setUser(mockUser);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing Supabase auth token:', e);
          }
        }
        
        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error.message);
          setLoading(false);
          return;
        }
        
        if (!session) {
          // No active session
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError.message);
        }
        
        // Combine auth and profile data
        const userData = {
          ...session.user,
          ...profile
        };
        
        setUser(userData);
      } catch (error) {
        console.error('Error in auth context:', error.message);
        setError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (event === 'SIGNED_IN') {
          // Similar logic as above for getting profile data
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          const userData = {
            ...session.user,
            ...profile
          };
          
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }
      
      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: email,
              role: userData.role || 'client',
              created_at: new Date()
            }
          ]);
          
        if (profileError) {
          throw profileError;
        }
        
        // If user is a client, create client record
        if (userData.role === 'client' || !userData.role) {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              {
                user_id: authData.user.id,
                profile_data: userData.profile_data || {}
              }
            ]);
            
          if (clientError) {
            throw clientError;
          }
        }
        
        // If user is a therapist, create therapist record
        if (userData.role === 'therapist') {
          const { error: therapistError } = await supabase
            .from('therapists')
            .insert([
              {
                user_id: authData.user.id,
                credentials: userData.credentials || {},
                availability: userData.availability || {}
              }
            ]);
            
          if (therapistError) {
            throw therapistError;
          }
        }
      }
      
      return authData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Check if we're using a mock user
      if (localStorage.getItem('smarttherapist_mock_user')) {
        localStorage.removeItem('smarttherapist_mock_user');
        setUser(null);
        console.log('Mock user signed out');
      } else {
        // Regular Supabase sign out
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw error;
        }
        
        setUser(null);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
