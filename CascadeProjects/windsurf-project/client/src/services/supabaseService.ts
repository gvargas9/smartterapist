/**
 * Supabase Service
 * 
 * A comprehensive utility service for interacting with Supabase.
 * This service provides methods for authentication, database operations,
 * storage management, and real-time subscriptions.
 */

import { AuthError, PostgrestError, RealtimeChannel, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { 
  Database, 
  User, 
  Client, 
  Therapist, 
  TherapySession, 
  Message, 
  BehaviorRecord 
} from '../types/supabase';

// Type for auth response
type AuthResponse = {
  data: {
    user: User | null;
    session: any | null;
  } | null;
  error: AuthError | null;
};

// Type for mapping Supabase User to our custom User type
type UserMapping = {
  id: string;
  email: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Type for database query options
type QueryOptions = {
  select?: string;
  filters?: Array<{
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'overlaps';
    value: any;
  }>;
  order?: {
    column: string;
    ascending: boolean;
  };
  pagination?: {
    from: number;
    to: number;
  };
};

// Type for database match condition
type MatchCondition = {
  column: string;
  value: any;
};

// Type for database response
type DatabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Type for subscription options
type SubscriptionOptions = {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: any;
};

/**
 * Authentication Methods
 */
export const auth = {
  /**
   * Sign up a new user
   * @param email - User's email
   * @param password - User's password
   * @returns Sign up result
   */
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await supabase.auth.signUp({ email, password });
    
    // Map Supabase response to our custom type
    return {
      data: response.data ? {
        user: response.data.user ? mapSupabaseUser(response.data.user) : null,
        session: response.data.session
      } : null,
      error: response.error
    };
  },

  /**
   * Sign in a user
   * @param email - User's email
   * @param password - User's password
   * @returns Sign in result
   */
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    
    // Map Supabase response to our custom type
    return {
      data: response.data ? {
        user: response.data.user ? mapSupabaseUser(response.data.user) : null,
        session: response.data.session
      } : null,
      error: response.error
    };
  },

  /**
   * Sign out the current user
   * @returns Sign out result
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current session
   * @returns Current session
   */
  getSession: async (): Promise<AuthResponse> => {
    const response = await supabase.auth.getSession();
    
    // Get user data if session exists
    let userData = null;
    if (response.data.session) {
      const userResponse = await supabase.auth.getUser();
      userData = userResponse.data.user ? mapSupabaseUser(userResponse.data.user) : null;
    }
    
    return {
      data: {
        user: userData,
        session: response.data.session
      },
      error: response.error
    };
  },

  /**
   * Get the current user
   * @returns Current user or null
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser();
    return data?.user ? mapSupabaseUser(data.user) : null;
  },

  /**
   * Reset password
   * @param email - User's email
   * @returns Password reset result
   */
  resetPassword: async (email: string): Promise<{ error: AuthError | null }> => {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  /**
   * Update user password
   * @param newPassword - New password
   * @returns Update result
   */
  updatePassword: async (newPassword: string): Promise<AuthResponse> => {
    const response = await supabase.auth.updateUser({ password: newPassword });
    
    return {
      data: response.data ? {
        user: response.data.user ? mapSupabaseUser(response.data.user) : null,
        session: null
      } : null,
      error: response.error
    };
  },

  /**
   * Set up auth state change listener
   * @param callback - Callback function to handle auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange: (callback: (event: string, session: any) => void): { data: { subscription: any } } => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * Database Methods
 */
export const db = {
  /**
   * Fetch data from a table
   * @param table - Table name
   * @param options - Query options (select, filters, etc.)
   * @returns Query result
   */
  fetch: async <T>(table: string, options: QueryOptions = {}): Promise<DatabaseResponse<T[]>> => {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters if provided
    if (options.filters) {
      for (const filter of options.filters) {
        const { column, operator, value } = filter;
        // Use type assertion to handle the operator method call
        query = (query as any)[operator](column, value);
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

    // Cast the response to match our expected DatabaseResponse type
    const response = await query;
    return {
      data: response.data as T[] | null,
      error: response.error
    };
  },

  /**
   * Insert data into a table
   * @param table - Table name
   * @param data - Data to insert
   * @returns Insert result
   */
  insert: async <T>(table: string, data: any): Promise<DatabaseResponse<T>> => {
    const response = await supabase.from(table).insert(data).select();
    return {
      data: response.data?.[0] as T | null,
      error: response.error
    };
  },

  /**
   * Update data in a table
   * @param table - Table name
   * @param data - Data to update
   * @param match - Match condition
   * @returns Update result
   */
  update: async <T>(table: string, data: any, match?: MatchCondition): Promise<DatabaseResponse<T>> => {
    let query = supabase.from(table).update(data);
    
    // Apply match condition
    if (match) {
      const { column, value } = match;
      query = query.match({ [column]: value });
    }
    
    // Add select to get the updated data and cast properly
    const response = await query.select();
    return {
      data: response.data?.[0] as T | null,
      error: response.error
    };
  },

  /**
   * Delete data from a table
   * @param table - Table name
   * @param match - Match condition
   * @returns Delete result
   */
  delete: async <T>(table: string, match?: MatchCondition): Promise<DatabaseResponse<T>> => {
    let query = supabase.from(table).delete();
    
    // Apply match condition
    if (match) {
      const { column, value } = match;
      query = query.match({ [column]: value });
    }
    
    // For delete operations, we'll return a success response with null data
    // as the deleted data is typically not needed
    const response = await query.select();
    return {
      data: null, // Delete operations don't need to return data
      error: response.error
    };
  },

  /**
   * Execute a stored procedure or function
   * @param functionName - Function name
   * @param params - Function parameters
   * @returns Function result
   */
  rpc: async <T>(functionName: string, params: Record<string, any> = {}): Promise<DatabaseResponse<T>> => {
    return await supabase.rpc(functionName, params);
  }
};

/**
 * Storage Methods
 */
export const storage = {
  /**
   * Upload a file to storage
   * @param bucket - Bucket name
   * @param path - File path in storage
   * @param file - File to upload
   * @param options - Upload options
   * @returns Upload result
   */
  upload: async (bucket: string, path: string, file: File, options: Record<string, any> = {}) => {
    return await supabase.storage.from(bucket).upload(path, file, options);
  },

  /**
   * Download a file from storage
   * @param bucket - Bucket name
   * @param path - File path in storage
   * @returns Download result
   */
  download: async (bucket: string, path: string) => {
    return await supabase.storage.from(bucket).download(path);
  },

  /**
   * Get a public URL for a file
   * @param bucket - Bucket name
   * @param path - File path in storage
   * @returns Public URL
   */
  getPublicUrl: (bucket: string, path: string): string => {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  /**
   * List files in a bucket
   * @param bucket - Bucket name
   * @param path - Path in bucket
   * @param options - List options
   * @returns List result
   */
  list: async (bucket: string, path: string = '', options: Record<string, any> = {}) => {
    return await supabase.storage.from(bucket).list(path, options);
  },

  /**
   * Remove a file from storage
   * @param bucket - Bucket name
   * @param path - File path in storage
   * @returns Remove result
   */
  remove: async (bucket: string, path: string) => {
    return await supabase.storage.from(bucket).remove([path]);
  },

  /**
   * Create a signed URL for temporary access
   * @param bucket - Bucket name
   * @param path - File path in storage
   * @param expiresIn - Expiration time in seconds
   * @returns Signed URL result
   */
  createSignedUrl: async (bucket: string, path: string, expiresIn: number = 60) => {
    return await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  }
};

/**
 * Realtime Methods
 */
export const realtime = {
  /**
   * Subscribe to changes in a table
   * @param table - Table name
   * @param callback - Callback function
   * @param options - Subscription options
   * @returns Subscription object with unsubscribe method
   */
  subscribe: (table: string, callback: (payload: any) => void, options: SubscriptionOptions = {}): { unsubscribe: () => void } => {
    const { event = '*' } = options;
    
    // Use type assertion to handle the realtime subscription
    const subscription = (supabase
      .channel(`public:${table}`) as any)
      .on('postgres_changes', { 
        event, 
        schema: 'public', 
        table 
      }, (payload: any) => {
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
 * @returns True if connection is healthy
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    // Try to get the session as a basic health check
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase health check failed:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during health check:', err instanceof Error ? err.message : String(err));
    return false;
  }
};

/**
 * Helper function to map Supabase User to our custom User type
 */
const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
  // Create a basic mapping with required fields
  const userMapping: UserMapping = {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
  };
  
  // Add optional fields from user metadata if available
  if (supabaseUser.user_metadata) {
    userMapping.role = supabaseUser.user_metadata.role;
    userMapping.first_name = supabaseUser.user_metadata.first_name;
    userMapping.last_name = supabaseUser.user_metadata.last_name;
    userMapping.phone = supabaseUser.user_metadata.phone;
  }
  
  // Add timestamps
  userMapping.created_at = supabaseUser.created_at;
  userMapping.updated_at = supabaseUser.updated_at;
  
  // Cast to our User type
  return userMapping as unknown as User;
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
