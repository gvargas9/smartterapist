/**
 * TherapySession Model
 * 
 * Provides methods for interacting with the therapy_sessions table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { TherapySession, InsertTables, UpdateTables } from '../types/supabase';

export class TherapySessionModel {
  /**
   * Get a therapy session by ID
   * @param id - Session ID
   * @returns The session or null if not found
   */
  static async getById(id: string): Promise<TherapySession | null> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching therapy session:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get therapy sessions by client ID
   * @param clientId - Client ID
   * @returns Array of sessions for the client
   */
  static async getByClientId(clientId: string): Promise<TherapySession[]> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_start', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions by client ID:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get therapy sessions by therapist ID
   * @param therapistId - Therapist ID
   * @returns Array of sessions for the therapist
   */
  static async getByTherapistId(therapistId: string): Promise<TherapySession[]> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('therapist_id', therapistId)
      .order('scheduled_start', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions by therapist ID:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get therapy sessions with client and therapist data
   * @param filters - Optional filters to apply
   * @returns Array of sessions with related data
   */
  static async getWithRelatedData(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase
      .from('therapy_sessions')
      .select(`
        *,
        clients!therapy_sessions_client_id_fkey (
          *,
          users:user_id (*)
        ),
        therapists!therapy_sessions_therapist_id_fkey (
          *,
          users:user_id (*)
        )
      `);
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching sessions with related data:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get upcoming sessions for a client or therapist
   * @param userId - User ID
   * @param role - User role ('client' or 'therapist')
   * @returns Array of upcoming sessions
   */
  static async getUpcomingSessions(userId: string, role: 'client' | 'therapist'): Promise<TherapySession[]> {
    // First, get the client or therapist ID based on the user ID
    const { data: profileData, error: profileError } = await supabase
      .from(role === 'client' ? 'clients' : 'therapists')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.error(`Error fetching ${role} profile:`, profileError);
      return [];
    }
    
    const profileId = profileData.id;
    const now = new Date().toISOString();
    
    // Then get the upcoming sessions
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq(role === 'client' ? 'client_id' : 'therapist_id', profileId)
      .gte('scheduled_start', now)
      .order('scheduled_start', { ascending: true });
    
    if (error) {
      console.error('Error fetching upcoming sessions:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new therapy session
   * @param session - Session data to insert
   * @returns The created session or null if there was an error
   */
  static async create(session: InsertTables<'therapy_sessions'>): Promise<TherapySession | null> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating therapy session:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a therapy session
   * @param id - Session ID
   * @param updates - Session data to update
   * @returns The updated session or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'therapy_sessions'>): Promise<TherapySession | null> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating therapy session:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a therapy session
   * @param id - Session ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('therapy_sessions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting therapy session:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Update session status
   * @param id - Session ID
   * @param status - New status
   * @returns The updated session or null if there was an error
   */
  static async updateStatus(id: string, status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'): Promise<TherapySession | null> {
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session status:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Start a session (update status and set actual_start)
   * @param id - Session ID
   * @returns The updated session or null if there was an error
   */
  static async startSession(id: string): Promise<TherapySession | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update({
        status: 'in-progress',
        actual_start: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error starting session:', error);
      return null;
    }
    
    return data;
  }

  /**
   * End a session (update status and set actual_end)
   * @param id - Session ID
   * @param notes - Optional session notes
   * @returns The updated session or null if there was an error
   */
  static async endSession(id: string, notes?: string): Promise<TherapySession | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('therapy_sessions')
      .update({
        status: 'completed',
        actual_end: now,
        ...(notes && { notes })
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error ending session:', error);
      return null;
    }
    
    return data;
  }

  /**
   * List all therapy sessions with pagination
   * @param page - Page number (starting from 0)
   * @param limit - Number of items per page
   * @returns Array of sessions
   */
  static async list(page: number = 0, limit: number = 10): Promise<TherapySession[]> {
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .range(from, to)
      .order('scheduled_start', { ascending: false });
    
    if (error) {
      console.error('Error listing therapy sessions:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Count total number of therapy sessions
   * @returns Total count of sessions
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('therapy_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting therapy sessions:', error);
      return 0;
    }
    
    return count || 0;
  }
}
