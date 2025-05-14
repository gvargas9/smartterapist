import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Development-only login component that provides quick login buttons
 * for the mock user accounts
 */
const DevLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock user credentials
  const mockUsers = {
    client: {
      email: 'client@example.com',
      password: 'password123',
      role: 'client'
    },
    therapist: {
      email: 'therapist@example.com',
      password: 'password123',
      role: 'therapist'
    },
    admin: {
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    }
  };

  // Mock login function that bypasses authentication for development purposes
  const handleLogin = (userType) => {
    try {
      setLoading(true);
      setError('');
      
      if (!mockUsers[userType]) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const user = mockUsers[userType];
      
      // Create mock user data with all necessary fields
      const mockUser = {
        id: `${userType}-1`,
        email: user.email,
        role: user.role,
        name: user.name || `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
        profile_data: {
          name: user.name || `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`
        }
      };
      
      // Create a mock Supabase session structure
      const mockSession = {
        provider_token: null,
        provider_refresh_token: null,
        access_token: 'mock-token-' + Math.random().toString(36).substring(2),
        refresh_token: 'mock-refresh-' + Math.random().toString(36).substring(2),
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      };
      
      // Store in localStorage with the Supabase project ID in the correct format
      localStorage.setItem('sb-nvrvldvrqxlhcebxqowk-auth-token', JSON.stringify({
        currentSession: mockSession,
        expiresAt: mockSession.expires_at
      }));
      
      // Also store in our custom key for backup
      localStorage.setItem('smarttherapist_mock_user', JSON.stringify(mockUser));
      
      console.log(`✅ Mock login successful as ${userType}`);
      
      // Navigate to the appropriate dashboard
      setTimeout(() => {
        switch (userType) {
          case 'client':
            window.location.href = '/client/dashboard';
            break;
          case 'therapist':
            window.location.href = '/therapist/dashboard';
            break;
          case 'admin':
            window.location.href = '/admin/dashboard';
            break;
          default:
            window.location.reload();
        }
      }, 500);
    } catch (error) {
      console.error(`Error with mock login as ${userType}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Development Login</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-800 text-xs rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <button
          onClick={() => handleLogin('client')}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login as Client'}
        </button>
        <button
          onClick={() => handleLogin('therapist')}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login as Therapist'}
        </button>
        <button
          onClick={() => handleLogin('admin')}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login as Admin'}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Note: You may need to create these users in Supabase first.</p>
        <p>Email: {mockUsers.client.email}</p>
        <p>Password: {mockUsers.client.password}</p>
      </div>
    </div>
  );
};

export default DevLogin;
