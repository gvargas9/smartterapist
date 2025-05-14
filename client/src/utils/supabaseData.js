/**
 * Supabase Data Utilities
 * 
 * This file provides utilities for fetching data from Supabase
 * to replace the hardcoded mock data in the application.
 */

import { supabase } from '../services/supabaseClient';
import { userService, clientService, behaviorService, sessionService, summaryService, statsService } from '../services/supabaseDataService';

// Flag to determine if we're in development mode
export const DEV_MODE = process.env.NODE_ENV === 'development';

// Function to get a user based on role
export const getUser = async (role = 'therapist') => {
  try {
    const users = await userService.getUsersByRole(role);
    return users[0] || null;
  } catch (error) {
    console.error(`Error getting ${role} user:`, error);
    return null;
  }
};

// Function to initialize the application
export const initApp = async () => {
  if (DEV_MODE) {
    console.log('🔧 Development mode enabled - Using Supabase data');
    
    // Store a default user in localStorage if not already present
    if (!localStorage.getItem('smarttherapist_user')) {
      const defaultUser = await getUser('therapist');
      
      if (defaultUser) {
        localStorage.setItem('smarttherapist_user', JSON.stringify(defaultUser));
        console.log('Created default user (therapist) from Supabase');
      } else {
        console.error('Failed to get default user from Supabase');
      }
    }
  }
};

// Data access functions
export const DATA = {
  // Get clients data
  getClients: async () => {
    try {
      return await clientService.getClients();
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },
  
  // Get behaviors data
  getBehaviors: async () => {
    try {
      return await behaviorService.getBehaviors();
    } catch (error) {
      console.error('Error fetching behaviors:', error);
      return [];
    }
  },
  
  // Get sessions data
  getSessions: async () => {
    try {
      return await sessionService.getSessions();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },
  
  // Get upcoming sessions
  getUpcomingSessions: async () => {
    try {
      return await sessionService.getUpcomingSessions();
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      return [];
    }
  },
  
  // Get summaries data
  getSummaries: async () => {
    try {
      return await summaryService.getSummaries();
    } catch (error) {
      console.error('Error fetching summaries:', error);
      return [];
    }
  },
  
  // Get recent summaries
  getRecentSummaries: async (limit = 5) => {
    try {
      return await summaryService.getRecentSummaries(limit);
    } catch (error) {
      console.error('Error fetching recent summaries:', error);
      return [];
    }
  },
  
  // Get system stats
  getStats: async () => {
    try {
      return await statsService.getSystemStats();
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        users: { total: 0, clients: 0, therapists: 0, admins: 0 },
        behaviors: 0,
        conversations: 0,
        messages: 0
      };
    }
  }
};

export default {
  DEV_MODE,
  getUser,
  initApp,
  DATA
};
