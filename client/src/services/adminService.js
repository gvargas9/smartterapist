import { supabase } from './supabaseClient';

/**
 * Service for handling admin-related functionality
 */
export const adminService = {
  /**
   * Get all users
   * @param {string} role - Optional role filter
   * @returns {Promise<Array>} - Array of user data
   */
  async getUsers(role = null) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (role) {
        query = query.eq('role', role);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  /**
   * Get user details
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The user data
   */
  async getUserDetails(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Get role-specific data
      if (data.role === 'client') {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (clientError && clientError.code !== 'PGRST116') throw clientError;
        
        data.client_data = clientData || null;
      } else if (data.role === 'therapist') {
        const { data: therapistData, error: therapistError } = await supabase
          .from('therapists')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (therapistError && therapistError.code !== 'PGRST116') throw therapistError;
        
        data.therapist_data = therapistData || null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },
  
  /**
   * Create a new user
   * @param {Object} userData - The user data
   * @returns {Promise<Object>} - The created user
   */
  async createUser(userData) {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Create user in database
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          profile_data: userData.profile_data || {},
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Create role-specific data
      if (userData.role === 'client') {
        const { error: clientError } = await supabase
          .from('clients')
          .insert([{
            user_id: data.id,
            subscription_id: userData.subscription_id,
            profile_data: userData.client_data || {}
          }]);
          
        if (clientError) throw clientError;
      } else if (userData.role === 'therapist') {
        const { error: therapistError } = await supabase
          .from('therapists')
          .insert([{
            user_id: data.id,
            credentials: userData.credentials || {},
            availability: userData.availability || {}
          }]);
          
        if (therapistError) throw therapistError;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  /**
   * Update a user
   * @param {string} userId - The user ID
   * @param {Object} userData - The user data to update
   * @returns {Promise<Object>} - The updated user
   */
  async updateUser(userId, userData) {
    try {
      // Update user in database
      const { data, error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          role: userData.role,
          name: userData.name,
          profile_data: userData.profile_data || {}
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update role-specific data
      if (userData.role === 'client' && userData.client_data) {
        const { error: clientError } = await supabase
          .from('clients')
          .upsert([{
            user_id: userId,
            subscription_id: userData.subscription_id,
            profile_data: userData.client_data
          }]);
          
        if (clientError) throw clientError;
      } else if (userData.role === 'therapist' && userData.therapist_data) {
        const { error: therapistError } = await supabase
          .from('therapists')
          .upsert([{
            user_id: userId,
            credentials: userData.credentials || {},
            availability: userData.availability || {}
          }]);
          
        if (therapistError) throw therapistError;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  /**
   * Delete a user
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      // Delete user from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  /**
   * Get all behavior presets
   * @returns {Promise<Array>} - Array of behavior presets
   */
  async getBehaviorPresets() {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*, created_by:users(name)')
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching behavior presets:', error);
      throw error;
    }
  },
  
  /**
   * Get behavior preset details
   * @param {string} behaviorId - The behavior ID
   * @returns {Promise<Object>} - The behavior preset data
   */
  async getBehaviorPresetDetails(behaviorId) {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*, created_by:users(name)')
        .eq('id', behaviorId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching behavior preset details:', error);
      throw error;
    }
  },
  
  /**
   * Create a new behavior preset
   * @param {Object} behaviorData - The behavior preset data
   * @returns {Promise<Object>} - The created behavior preset
   */
  async createBehaviorPreset(behaviorData) {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .insert([{
          name: behaviorData.name,
          prompt_template: behaviorData.prompt_template,
          created_by: behaviorData.created_by,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating behavior preset:', error);
      throw error;
    }
  },
  
  /**
   * Update a behavior preset
   * @param {string} behaviorId - The behavior ID
   * @param {Object} behaviorData - The behavior preset data to update
   * @returns {Promise<Object>} - The updated behavior preset
   */
  async updateBehaviorPreset(behaviorId, behaviorData) {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .update({
          name: behaviorData.name,
          prompt_template: behaviorData.prompt_template
        })
        .eq('id', behaviorId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating behavior preset:', error);
      throw error;
    }
  },
  
  /**
   * Delete a behavior preset
   * @param {string} behaviorId - The behavior ID
   * @returns {Promise<void>}
   */
  async deleteBehaviorPreset(behaviorId) {
    try {
      const { error } = await supabase
        .from('behaviors')
        .delete()
        .eq('id', behaviorId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting behavior preset:', error);
      throw error;
    }
  },
  
  /**
   * Get system statistics
   * @returns {Promise<Object>} - System statistics
   */
  async getSystemStats() {
    try {
      // Get user counts by role
      const { data: userCounts, error: userError } = await supabase
        .rpc('get_user_counts_by_role');
        
      if (userError) throw userError;
      
      // Get conversation counts
      const { data: conversationCount, error: convError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });
        
      if (convError) throw convError;
      
      // Get message counts
      const { data: messageCount, error: msgError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true });
        
      if (msgError) throw msgError;
      
      // Get behavior preset counts
      const { data: behaviorCount, error: behaviorError } = await supabase
        .from('behaviors')
        .select('id', { count: 'exact', head: true });
        
      if (behaviorError) throw behaviorError;
      
      return {
        users: userCounts,
        conversations: conversationCount,
        messages: messageCount,
        behaviors: behaviorCount
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }
};
