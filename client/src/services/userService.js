import { supabase } from './supabaseClient';

/**
 * Service for handling user-related functionality
 */
export const userService = {
  /**
   * Get user profile data
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - The user profile data
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  /**
   * Get client-specific data
   * @param {string} userId - The client's user ID
   * @returns {Promise<Object>} - The client data
   */
  async getClientData(userId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching client data:', error);
      throw error;
    }
  },
  
  /**
   * Get therapist-specific data
   * @param {string} userId - The therapist's user ID
   * @returns {Promise<Object>} - The therapist data
   */
  async getTherapistData(userId) {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching therapist data:', error);
      throw error;
    }
  },
  
  /**
   * Get a list of clients for a therapist
   * @param {string} therapistId - The therapist's user ID
   * @returns {Promise<Array>} - Array of client data
   */
  async getTherapistClients(therapistId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('client_id')
        .eq('therapist_id', therapistId)
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      // Get unique client IDs
      const clientIds = [...new Set(data.map(session => session.client_id))];
      
      // Get client profiles
      const { data: clients, error: clientsError } = await supabase
        .from('users')
        .select('*, clients(*)')
        .in('id', clientIds);
        
      if (clientsError) throw clientsError;
      
      return clients;
    } catch (error) {
      console.error('Error fetching therapist clients:', error);
      throw error;
    }
  },
  
  /**
   * Get upcoming sessions for a user
   * @param {string} userId - The user's ID
   * @param {string} role - The user's role ('client' or 'therapist')
   * @returns {Promise<Array>} - Array of upcoming sessions
   */
  async getUpcomingSessions(userId, role) {
    try {
      const query = supabase
        .from('sessions')
        .select(`
          *,
          clients:users!sessions_client_id_fkey(*),
          therapists:users!sessions_therapist_id_fkey(*)
        `)
        .gt('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
        
      // Filter by role
      if (role === 'client') {
        query.eq('client_id', userId);
      } else if (role === 'therapist') {
        query.eq('therapist_id', userId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get recent conversations for a user
   * @param {string} userId - The user's ID
   * @param {string} role - The user's role ('client' or 'therapist')
   * @param {number} limit - Maximum number of conversations to return
   * @returns {Promise<Array>} - Array of recent conversations
   */
  async getRecentConversations(userId, role, limit = 5) {
    try {
      const query = supabase
        .from('conversations')
        .select(`
          *,
          clients:users!conversations_client_id_fkey(*),
          therapists:users!conversations_therapist_id_fkey(*),
          summaries(*)
        `)
        .order('start_ts', { ascending: false })
        .limit(limit);
        
      // Filter by role
      if (role === 'client') {
        query.eq('client_id', userId);
      } else if (role === 'therapist') {
        query.eq('therapist_id', userId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {string} userId - The user's ID
   * @param {Object} profileData - The profile data to update
   * @returns {Promise<Object>} - The updated profile
   */
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  /**
   * Schedule a session
   * @param {Object} sessionData - The session data
   * @returns {Promise<Object>} - The created session
   */
  async scheduleSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error scheduling session:', error);
      throw error;
    }
  }
};
