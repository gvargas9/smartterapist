/**
 * Supabase Service
 * 
 * A comprehensive utility service for interacting with Supabase.
 * This service provides methods for authentication, database operations,
 * storage management, and real-time subscriptions.
 */

import { supabase } from './supabaseClient';

/**
 * Authentication Methods
 */
export const auth = {
  /**
   * Sign up a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Sign up result
   */
  signUp: async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  },

  /**
   * Sign in a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Sign in result
   */
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Sign out the current user
   * @returns {Promise} - Sign out result
   */
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current session
   * @returns {Promise} - Current session
   */
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  /**
   * Get the current user
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },

  /**
   * Reset password
   * @param {string} email - User's email
   * @returns {Promise} - Password reset result
   */
  resetPassword: async (email) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise} - Update result
   */
  updatePassword: async (newPassword) => {
    return await supabase.auth.updateUser({ password: newPassword });
  },

  /**
   * Set up auth state change listener
   * @param {Function} callback - Callback function to handle auth state changes
   * @returns {Function} - Unsubscribe function
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * Database Methods
 */
export const db = {
  /**
   * Fetch data from a table
   * @param {string} table - Table name
   * @param {Object} options - Query options (select, filters, etc.)
   * @returns {Promise} - Query result
   */
  fetch: async (table, options = {}) => {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters if provided
    if (options.filters) {
      for (const filter of options.filters) {
        const { column, operator, value } = filter;
        query = query[operator](column, value);
      }
    }

    // Apply order if provided
    if (options.order) {
      const { column, ascending } = options.order;
      query = query.order(column, { ascending });
    }

    // Apply pagination if provided
    if (options.pagination) {
      const { from, to } = options.pagination;
      query = query.range(from, to);
    }

    return await query;
  },

  /**
   * Insert data into a table
   * @param {string} table - Table name
   * @param {Object|Array} data - Data to insert
   * @returns {Promise} - Insert result
   */
  insert: async (table, data) => {
    return await supabase.from(table).insert(data);
  },

  /**
   * Update data in a table
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} match - Match condition
   * @returns {Promise} - Update result
   */
  update: async (table, data, match) => {
    let query = supabase.from(table).update(data);
    
    // Apply match condition
    if (match) {
      const { column, value } = match;
      query = query.match({ [column]: value });
    }
    
    return await query;
  },

  /**
   * Delete data from a table
   * @param {string} table - Table name
   * @param {Object} match - Match condition
   * @returns {Promise} - Delete result
   */
  delete: async (table, match) => {
    let query = supabase.from(table).delete();
    
    // Apply match condition
    if (match) {
      const { column, value } = match;
      query = query.match({ [column]: value });
    }
    
    return await query;
  },

  /**
   * Execute a stored procedure or function
   * @param {string} functionName - Function name
   * @param {Object} params - Function parameters
   * @returns {Promise} - Function result
   */
  rpc: async (functionName, params = {}) => {
    return await supabase.rpc(functionName, params);
  }
};

/**
 * Storage Methods
 */
export const storage = {
  /**
   * Upload a file to storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in storage
   * @param {File} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise} - Upload result
   */
  upload: async (bucket, path, file, options = {}) => {
    return await supabase.storage.from(bucket).upload(path, file, options);
  },

  /**
   * Download a file from storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in storage
   * @returns {Promise} - Download result
   */
  download: async (bucket, path) => {
    return await supabase.storage.from(bucket).download(path);
  },

  /**
   * Get a public URL for a file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in storage
   * @returns {string} - Public URL
   */
  getPublicUrl: (bucket, path) => {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  /**
   * List files in a bucket
   * @param {string} bucket - Bucket name
   * @param {string} path - Path in bucket
   * @param {Object} options - List options
   * @returns {Promise} - List result
   */
  list: async (bucket, path = '', options = {}) => {
    return await supabase.storage.from(bucket).list(path, options);
  },

  /**
   * Remove a file from storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in storage
   * @returns {Promise} - Remove result
   */
  remove: async (bucket, path) => {
    return await supabase.storage.from(bucket).remove([path]);
  },

  /**
   * Create a signed URL for temporary access
   * @param {string} bucket - Bucket name
   * @param {string} path - File path in storage
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise} - Signed URL result
   */
  createSignedUrl: async (bucket, path, expiresIn = 60) => {
    return await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  }
};

/**
 * Realtime Methods
 */
export const realtime = {
  /**
   * Subscribe to changes in a table
   * @param {string} table - Table name
   * @param {Function} callback - Callback function
   * @param {Object} options - Subscription options
   * @returns {Object} - Subscription object with unsubscribe method
   */
  subscribe: (table, callback, options = {}) => {
    const { event = '*', filter } = options;
    
    let subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { 
        event, 
        schema: 'public', 
        table 
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
      
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }
};

/**
 * Health check method
 * @returns {Promise<boolean>} - True if connection is healthy
 */
export const checkHealth = async () => {
  try {
    // Try to get the session as a basic health check
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase health check failed:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during health check:', err.message);
    return false;
  }
};

// Default export with all services
export default {
  auth,
  db,
  storage,
  realtime,
  checkHealth,
  client: supabase // Direct access to the Supabase client if needed
};
