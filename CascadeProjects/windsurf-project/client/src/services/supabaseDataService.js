/**
 * Supabase Data Service
 * 
 * This service provides methods to fetch data from Supabase instead of using hardcoded mock data.
 * It's designed to replace the mock data in devMode.js with real data from Supabase.
 */

import { supabase } from './supabaseClient';

/**
 * User-related data methods
 */
export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  getUserById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  },
  
  /**
   * Get user by role
   * @param {string} role - User role (client, therapist, admin)
   * @returns {Promise<Array>} Array of users with the specified role
   */
  getUsersByRole: async (role) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      return [];
    }
  }
};

/**
 * Client-related data methods
 */
export const clientService = {
  /**
   * Get all clients
   * @returns {Promise<Array>} Array of clients
   */
  getClients: async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          users:user_id (
            profile_data
          ),
          client_behaviors (
            id,
            behavior_id
          )
        `);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },
  
  /**
   * Get client by ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object|null>} Client object or null
   */
  getClientById: async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          users:user_id (
            profile_data
          ),
          client_behaviors (
            id,
            behavior_id,
            behaviors (*)
          )
        `)
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      return null;
    }
  },
  
  /**
   * Get clients by therapist ID
   * @param {string} therapistId - Therapist ID
   * @returns {Promise<Array>} Array of clients assigned to the therapist
   */
  getClientsByTherapistId: async (therapistId) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          users:user_id (
            profile_data
          ),
          client_behaviors (
            id,
            behavior_id
          )
        `)
        .eq('therapist_id', therapistId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching clients for therapist ${therapistId}:`, error);
      return [];
    }
  }
};

/**
 * Behavior-related data methods
 */
export const behaviorService = {
  /**
   * Get all behaviors
   * @returns {Promise<Array>} Array of behaviors
   */
  getBehaviors: async () => {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching behaviors:', error);
      return [];
    }
  },
  
  /**
   * Get behavior by ID
   * @param {string} behaviorId - Behavior ID
   * @returns {Promise<Object|null>} Behavior object or null
   */
  getBehaviorById: async (behaviorId) => {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*')
        .eq('id', behaviorId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching behavior ${behaviorId}:`, error);
      return null;
    }
  },
  
  /**
   * Get behaviors by client ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} Array of behaviors assigned to the client
   */
  getBehaviorsByClientId: async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('client_behaviors')
        .select(`
          behavior_id,
          behaviors (*)
        `)
        .eq('client_id', clientId);
      
      if (error) throw error;
      
      // Extract the behavior objects from the nested structure
      return data ? data.map(item => item.behaviors) : [];
    } catch (error) {
      console.error(`Error fetching behaviors for client ${clientId}:`, error);
      return [];
    }
  }
};

/**
 * Session-related data methods
 */
export const sessionService = {
  /**
   * Get all sessions
   * @returns {Promise<Array>} Array of sessions
   */
  getSessions: async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients (
            id,
            users (
              profile_data
            )
          )
        `);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },
  
  /**
   * Get upcoming sessions
   * @returns {Promise<Array>} Array of upcoming sessions
   */
  getUpcomingSessions: async () => {
    const now = new Date().toISOString();
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients (
            id,
            users (
              profile_data
            )
          )
        `)
        .gte('start_time', now)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      return [];
    }
  },
  
  /**
   * Get sessions by client ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} Array of sessions for the client
   */
  getSessionsByClientId: async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching sessions for client ${clientId}:`, error);
      return [];
    }
  }
};

/**
 * Summary-related data methods
 */
export const summaryService = {
  /**
   * Get all summaries
   * @returns {Promise<Array>} Array of summaries
   */
  getSummaries: async () => {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select(`
          *,
          conversations (
            client_id,
            clients (
              users (
                profile_data
              )
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching summaries:', error);
      return [];
    }
  },
  
  /**
   * Get recent summaries
   * @param {number} limit - Number of summaries to return
   * @returns {Promise<Array>} Array of recent summaries
   */
  getRecentSummaries: async (limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select(`
          *,
          conversations (
            client_id,
            clients (
              users (
                profile_data
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent summaries:', error);
      return [];
    }
  },
  
  /**
   * Get summaries by client ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} Array of summaries for the client
   */
  getSummariesByClientId: async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select(`
          *,
          conversations!inner (
            client_id
          )
        `)
        .eq('conversations.client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching summaries for client ${clientId}:`, error);
      return [];
    }
  }
};

/**
 * Stats-related data methods
 */
export const statsService = {
  /**
   * Get system stats
   * @returns {Promise<Object>} System stats
   */
  getSystemStats: async () => {
    try {
      // Get user counts by role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role');
      
      if (usersError) throw usersError;
      
      // Count users by role
      const userCounts = {
        total: users.length,
        clients: users.filter(user => user.role === 'client').length,
        therapists: users.filter(user => user.role === 'therapist').length,
        admins: users.filter(user => user.role === 'admin').length
      };
      
      // Get behavior count
      const { count: behaviorsCount, error: behaviorsError } = await supabase
        .from('behaviors')
        .select('id', { count: 'exact', head: true });
      
      if (behaviorsError) throw behaviorsError;
      
      // Get conversation count
      const { count: conversationsCount, error: conversationsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });
      
      if (conversationsError) throw conversationsError;
      
      // Get message count
      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true });
      
      if (messagesError) throw messagesError;
      
      return {
        users: userCounts,
        behaviors: behaviorsCount,
        conversations: conversationsCount,
        messages: messagesCount
      };
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

// Default export with all services
export default {
  users: userService,
  clients: clientService,
  behaviors: behaviorService,
  sessions: sessionService,
  summaries: summaryService,
  stats: statsService
};
