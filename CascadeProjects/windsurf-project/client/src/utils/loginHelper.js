/**
 * Login Helper Utility
 * 
 * This file provides utility functions to help with login during development.
 */

// Mock user credentials
export const mockUsers = {
  client: {
    email: 'client@example.com',
    password: 'password123',
    role: 'client',
    name: 'Client User'
  },
  therapist: {
    email: 'therapist@example.com',
    password: 'password123',
    role: 'therapist',
    name: 'Therapist User'
  },
  admin: {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    name: 'Admin User'
  }
};

// Mock login function that bypasses authentication for development purposes
export const mockLogin = (userType) => {
  try {
    if (!mockUsers[userType]) {
      throw new Error(`Invalid user type: ${userType}`);
    }

    const user = mockUsers[userType];
    
    // Store mock user in localStorage to simulate authentication
    localStorage.setItem('smarttherapist_mock_user', JSON.stringify({
      id: `${userType}-1`,
      email: user.email,
      role: user.role,
      name: user.name || `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
      profile_data: {
        name: user.name || `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`
      }
    }));
    
    console.log(`Mock login successful as ${userType}`);
    
    // Navigate to the appropriate dashboard based on user type
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
        window.location.href = '/';
    }
    
    return true;
  } catch (error) {
    console.error(`Error with mock login as ${userType}:`, error);
    return false;
  }
};

// Function to run in the browser console
export const loginAs = (userType) => {
  return mockLogin(userType);
};

// Export a global function for browser console use
if (typeof window !== 'undefined') {
  window.loginAs = loginAs;
}

export default {
  mockUsers,
  mockLogin,
  loginAs
};
