import { supabase } from './supabaseClient';

/**
 * Service for handling therapist-related functionality
 */
export const therapistService = {
  /**
   * Get assigned clients for a therapist
   * @param {string} therapistId - The therapist's user ID
   * @returns {Promise<Array>} - Array of client data
   */
  async getAssignedClients(therapistId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          users:user_id (id, email, name, profile_data),
          client_behaviors (
            behaviors (id, name, prompt_template)
          ),
          conversations (
            id,
            start_ts,
            end_ts,
            summaries (
              id,
              summary_text,
              sentiment_metrics,
              created_at
            )
          )
        `)
        .eq('therapist_id', therapistId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching assigned clients:', error);
      throw error;
    }
  },
  
  /**
   * Get client details
   * @param {string} clientId - The client's user ID
   * @returns {Promise<Object>} - The client data
   */
  async getClientDetails(clientId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          users:user_id (id, email, name, profile_data),
          client_behaviors (
            behaviors (id, name, prompt_template)
          )
        `)
        .eq('user_id', clientId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  },
  
  /**
   * Get client conversations
   * @param {string} clientId - The client's user ID
   * @returns {Promise<Array>} - Array of conversation data
   */
  async getClientConversations(clientId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          summaries (
            id,
            summary_text,
            sentiment_metrics,
            created_at
          ),
          messages (
            id,
            sender,
            text,
            timestamp,
            sentiment_score
          )
        `)
        .eq('client_id', clientId)
        .order('start_ts', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching client conversations:', error);
      throw error;
    }
  },
  
  /**
   * Get available behavior presets
   * @returns {Promise<Array>} - Array of behavior presets
   */
  async getBehaviorPresets() {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching behavior presets:', error);
      throw error;
    }
  },
  
  /**
   * Add a behavior to a client
   * @param {string} clientId - The client's user ID
   * @param {string} behaviorId - The behavior ID
   * @param {boolean} active - Whether the behavior is active
   * @returns {Promise<Object>} - The created client behavior
   */
  async addClientBehavior(clientId, behaviorId, active = true) {
    try {
      const { data, error } = await supabase
        .from('client_behaviors')
        .insert([{
          client_id: clientId,
          behavior_id: behaviorId,
          active
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error adding client behavior:', error);
      throw error;
    }
  },
  
  /**
   * Update a client behavior
   * @param {string} clientId - The client's user ID
   * @param {string} behaviorId - The behavior ID
   * @param {boolean} active - Whether the behavior is active
   * @returns {Promise<Object>} - The updated client behavior
   */
  async updateClientBehavior(clientId, behaviorId, active) {
    try {
      const { data, error } = await supabase
        .from('client_behaviors')
        .update({ active })
        .match({ client_id: clientId, behavior_id: behaviorId })
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating client behavior:', error);
      throw error;
    }
  },
  
  /**
   * Remove a behavior from a client
   * @param {string} clientId - The client's user ID
   * @param {string} behaviorId - The behavior ID
   * @returns {Promise<void>}
   */
  async removeClientBehavior(clientId, behaviorId) {
    try {
      const { error } = await supabase
        .from('client_behaviors')
        .delete()
        .match({ client_id: clientId, behavior_id: behaviorId });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error removing client behavior:', error);
      throw error;
    }
  },
  
  /**
   * Get upcoming sessions for a therapist
   * @param {string} therapistId - The therapist's user ID
   * @returns {Promise<Array>} - Array of upcoming sessions
   */
  async getUpcomingSessions(therapistId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients:users!sessions_client_id_fkey(id, email, name, profile_data)
        `)
        .eq('therapist_id', therapistId)
        .gt('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get recent conversation summaries
   * @param {string} therapistId - The therapist's user ID
   * @param {number} limit - Maximum number of summaries to return
   * @returns {Promise<Array>} - Array of recent summaries
   */
  async getRecentSummaries(therapistId, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select(`
          *,
          conversations (
            id,
            client_id,
            start_ts,
            clients:users!conversations_client_id_fkey(id, email, name, profile_data)
          )
        `)
        .eq('therapist_id', therapistId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recent summaries:', error);
      throw error;
    }
  },
  
  /**
   * Schedule a session with a client
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
  },
  
  /**
   * Get session details
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} - The session data
   */
  async getSessionDetails(sessionId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          clients:users!sessions_client_id_fkey(id, email, name, profile_data),
          therapists:users!sessions_therapist_id_fkey(id, email, name, profile_data)
        `)
        .eq('id', sessionId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }
};
