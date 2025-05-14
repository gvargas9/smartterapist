import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Development-only login component that provides quick login buttons
 * for the mock user accounts
 */
const DevLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);
  
  // Load minimized state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('dev_login_minimized');
    if (savedState) {
      setMinimized(savedState === 'true');
    }
  }, []);
  
  // Save minimized state to localStorage
  const toggleMinimized = () => {
    const newState = !minimized;
    setMinimized(newState);
    localStorage.setItem('dev_login_minimized', String(newState));
  };

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
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-300 ease-in-out overflow-hidden"
         style={{ maxHeight: minimized ? '40px' : '350px', width: minimized ? '180px' : '250px' }}
    >
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Development Login</h3>
        <button 
          onClick={toggleMinimized}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {minimized ? 
            <span className="text-xs">▼ Expand</span> : 
            <span className="text-xs">▲ Minimize</span>
          }
        </button>
      </div>
      
      <div className="p-3" style={{ display: minimized ? 'none' : 'block' }}>
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
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
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
          
          <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
            <p>Note: Default credentials</p>
            <p>Email: {mockUsers.client.email}</p>
            <p>Password: {mockUsers.client.password}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
