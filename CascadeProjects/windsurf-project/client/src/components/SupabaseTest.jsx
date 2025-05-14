import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * SupabaseTest Component
 * 
 * This component demonstrates how to use the Supabase client in a React component.
 * It provides functionality for authentication and basic database operations.
 */
const SupabaseTest = () => {
  // State for authentication
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // State for database operations
  const [userData, setUserData] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('client');

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
        try {
          // Try to fetch user data
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
          
          if (!error && userData) {
            setUserData(userData);
            setFirstName(userData.first_name || '');
            setLastName(userData.last_name || '');
            setRole(userData.role || 'client');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserData(null);
        }
      }
    );

    // Clean up listener on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setMessage('Sign up successful! Check your email for confirmation.');
        
        // Create user record in the users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role,
            first_name: firstName,
            last_name: lastName
          });
        
        if (userError) {
          console.error('Error creating user record:', userError);
          setMessage('Account created but profile setup failed. Please contact support.');
        } else {
          setMessage('Account created successfully!');
        }
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setMessage('Signed in successfully!');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setMessage('Signed out successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user) {
      setMessage('You must be signed in to update your profile.');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          role
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh user data
      const { data: updatedData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      setUserData(updatedData);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render authentication form if not signed in
  if (!user) {
    return (
      <div className="supabase-test">
        <h2>Supabase Authentication Test</h2>
        
        {message && <div className="message">{message}</div>}
        
        <form onSubmit={handleSignUp}>
          <h3>Sign Up</h3>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label>Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label>Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="therapist">Therapist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Sign Up'}
          </button>
        </form>
        
        <form onSubmit={handleSignIn}>
          <h3>Sign In</h3>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // Render user profile if signed in
  return (
    <div className="supabase-test">
      <h2>Supabase User Profile</h2>
      
      {message && <div className="message">{message}</div>}
      
      <div className="user-info">
        <h3>User Information</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        {userData && (
          <>
            <p><strong>First Name:</strong> {userData.first_name || 'Not set'}</p>
            <p><strong>Last Name:</strong> {userData.last_name || 'Not set'}</p>
            <p><strong>Role:</strong> {userData.role}</p>
          </>
        )}
      </div>
      
      <form onSubmit={handleUpdateProfile}>
        <h3>Update Profile</h3>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client</option>
            <option value="therapist">Therapist</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Update Profile'}
        </button>
      </form>
      
      <button onClick={handleSignOut} disabled={loading}>
        {loading ? 'Processing...' : 'Sign Out'}
      </button>
    </div>
  );
};

export default SupabaseTest;
