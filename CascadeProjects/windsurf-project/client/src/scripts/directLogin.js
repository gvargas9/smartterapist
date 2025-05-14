// Direct Login Script for Development
// This script allows direct login with mock users by bypassing email confirmation

import { supabase } from '../services/supabaseClient';

// Mock user credentials
const mockUsers = {
  client: {
    email: 'client@example.com',
    password: 'password123',
    id: 'client-1'
  },
  therapist: {
    email: 'therapist@example.com',
    password: 'password123',
    id: 'therapist-1'
  },
  admin: {
    email: 'admin@example.com',
    password: 'password123',
    id: 'admin-1'
  }
};

/**
 * Direct login function that bypasses normal authentication flow
 * @param {string} userType - Type of user to login as (client, therapist, admin)
 */
export const directLogin = async (userType) => {
  try {
    if (!mockUsers[userType]) {
      throw new Error(`Invalid user type: ${userType}`);
    }

    const user = mockUsers[userType];
    
    // Try to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });
    
    if (error) {
      console.log('Normal login failed, trying admin API...');
      
      // If normal login fails, try to create a session directly
      // Note: This requires admin privileges and would only work in development
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { id: user.id }
      });
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Try logging in again after creating the user
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      
      if (loginError) {
        throw loginError;
      }
      
      console.log('Login successful via admin API');
      return loginData;
    }
    
    console.log('Login successful via normal flow');
    return data;
  } catch (error) {
    console.error('Direct login error:', error);
    throw error;
  }
};

// Export mock users for reference
export { mockUsers };
