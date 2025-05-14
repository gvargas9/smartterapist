/**
 * Direct Login Script
 * 
 * This file provides a direct way to log in for development purposes.
 * Copy and paste this entire function into your browser console to use it.
 */

function directLogin(userType) {
  // User types: 'client', 'therapist', or 'admin'
  if (!['client', 'therapist', 'admin'].includes(userType)) {
    console.error('Invalid user type. Use "client", "therapist", or "admin"');
    return false;
  }

  try {
    // Create mock user data
    const mockUser = {
      id: `${userType}-1`,
      email: `${userType}@example.com`,
      role: userType,
      name: `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
      profile_data: {
        name: `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`
      }
    };

    // Create a mock Supabase session
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

    // Store in localStorage with the Supabase project ID
    localStorage.setItem('sb-nvrvldvrqxlhcebxqowk-auth-token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: mockSession.expires_at
    }));

    // Also store in our custom key for backup
    localStorage.setItem('smarttherapist_mock_user', JSON.stringify(mockUser));

    console.log(`✅ Successfully logged in as ${userType}`);
    console.log('🔄 Reloading page to apply changes...');
    
    // Redirect to the appropriate dashboard
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
    
    return true;
  } catch (error) {
    console.error('Error during direct login:', error);
    return false;
  }
}

// Example usage:
// directLogin('therapist');
