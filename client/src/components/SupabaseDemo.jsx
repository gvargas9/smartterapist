import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import supabaseService from '../services/supabaseService';
// Import our models
import { UserModel, ClientModel, TherapistModel } from '../models';

const SupabaseDemo = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // State for model testing
  const [modelTestResult, setModelTestResult] = useState('');
  const [modelTestLoading, setModelTestLoading] = useState(false);

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isHealthy = await supabaseService.checkHealth();
      setConnectionStatus(isHealthy ? 'Connected' : 'Disconnected');
    };

    checkConnection();

    // Set up auth state change listener
    const { data: { subscription } } = supabaseService.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    // Check for existing session
    const getInitialSession = async () => {
      const { data } = await supabaseService.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };

    getInitialSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabaseService.auth.signUp(email, password);
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Sign up successful! Check your email for confirmation.');
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabaseService.auth.signIn(email, password);
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Sign in successful!');
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabaseService.auth.signOut();
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Signed out successfully!');
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supabase-demo">
      <h2>Supabase Integration Demo</h2>
      
      <div className="connection-status">
        <p>
          <strong>Connection Status:</strong> 
          <span className={connectionStatus === 'Connected' ? 'connected' : 'disconnected'}>
            {connectionStatus}
          </span>
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">TypeScript Models Test</h2>
        <p className="mb-4">Test our TypeScript models for interacting with the database:</p>
        
        <button
          onClick={async () => {
            setModelTestLoading(true);
            setModelTestResult('');
            
            try {
              // Test UserModel
              if (!user) {
                throw new Error('You must be signed in to test the models');
              }
              
              // Try to get the current user from the database
              const userData = await UserModel.getById(user.id);
              
              if (userData) {
                setModelTestResult(`Successfully retrieved user data: ${JSON.stringify(userData)}`);
              } else {
                // If user doesn't exist in the database yet, create them
                const newUser = await UserModel.create({
                  id: user.id,
                  email: user.email,
                  role: 'client',
                  first_name: 'Test',
                  last_name: 'User'
                });
                
                if (newUser) {
                  setModelTestResult(`Successfully created user: ${JSON.stringify(newUser)}`);
                  
                  // Test creating a client record
                  const client = await ClientModel.create({
                    user_id: user.id,
                    profile_data: { interests: ['therapy', 'wellness'] }
                  });
                  
                  if (client) {
                    setModelTestResult(prev => prev + '\n\nSuccessfully created client: ' + JSON.stringify(client));
                  }
                } else {
                  throw new Error('Failed to create user record');
                }
              }
            } catch (error) {
              setModelTestResult(`Error testing models: ${error.message}`);
            } finally {
              setModelTestLoading(false);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          disabled={modelTestLoading}
        >
          {modelTestLoading ? 'Testing...' : 'Test Models'}
        </button>
        
        {modelTestResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
            <pre className="whitespace-pre-wrap">{modelTestResult}</pre>
          </div>
        )}
      </div>

      {user ? (
        <div className="user-profile">
          <h3>User Profile</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <button 
            onClick={handleSignOut}
            disabled={loading}
          >
            {loading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div className="auth-form">
          <h3>Authentication</h3>
          <form>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="button-group">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="demo-section">
        <h3>Additional Features</h3>
        <p>
          This component demonstrates basic authentication with Supabase.
          The full supabaseService.js includes methods for:
        </p>
        <ul>
          <li>Database operations (fetch, insert, update, delete)</li>
          <li>Storage management (upload, download, list files)</li>
          <li>Realtime subscriptions</li>
          <li>RPC function calls</li>
        </ul>
      </div>

      <style jsx>{`
        .supabase-demo {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .connection-status {
          margin-bottom: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .connected {
          color: green;
          font-weight: bold;
        }
        .disconnected {
          color: red;
          font-weight: bold;
        }
        .auth-form, .user-profile {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .button-group {
          display: flex;
          gap: 10px;
        }
        button {
          padding: 8px 16px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #3367d6;
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .message {
          margin: 15px 0;
          padding: 10px;
          border-radius: 4px;
        }
        .error {
          background-color: #ffebee;
          color: #c62828;
        }
        .success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .demo-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        ul {
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
};

export default SupabaseDemo;
