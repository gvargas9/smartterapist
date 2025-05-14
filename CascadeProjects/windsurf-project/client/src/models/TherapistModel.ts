/**
 * Therapist Model
 * 
 * Provides methods for interacting with the therapists table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { Therapist, InsertTables, UpdateTables } from '../types/supabase';

export class TherapistModel {
  /**
   * Get a therapist by ID
   * @param id - Therapist ID
   * @returns The therapist or null if not found
   */
  static async getById(id: string): Promise<Therapist | null> {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching therapist:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get a therapist by user ID
   * @param userId - User ID
   * @returns The therapist or null if not found
   */
  static async getByUserId(userId: string): Promise<Therapist | null> {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching therapist by user ID:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get therapists with full user data
   * @param filters - Optional filters to apply
   * @returns Array of therapists with user data
   */
  static async getWithUserData(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase
      .from('therapists')
      .select(`
        *,
        users:user_id (*)
      `);
    
    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching therapists with user data:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get therapists by specialty
   * @param specialty - Specialty to search for
   * @returns Array of therapists with the specified specialty
   */
  static async getBySpecialty(specialty: string): Promise<Therapist[]> {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .contains('specialties', [specialty]);
    
    if (error) {
      console.error('Error fetching therapists by specialty:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new therapist
   * @param therapist - Therapist data to insert
   * @returns The created therapist or null if there was an error
   */
  static async create(therapist: InsertTables<'therapists'>): Promise<Therapist | null> {
    const { data, error } = await supabase
      .from('therapists')
      .insert(therapist)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating therapist:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a therapist
   * @param id - Therapist ID
   * @param updates - Therapist data to update
   * @returns The updated therapist or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'therapists'>): Promise<Therapist | null> {
    const { data, error } = await supabase
      .from('therapists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating therapist:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a therapist
   * @param id - Therapist ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('therapists')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting therapist:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Get all clients assigned to a therapist
   * @param therapistId - Therapist ID
   * @returns Array of clients assigned to the therapist
   */
  static async getClients(therapistId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        users:user_id (*)
      `)
      .eq('therapist_id', therapistId);
    
    if (error) {
      console.error('Error fetching therapist clients:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Update therapist availability
   * @param id - Therapist ID
   * @param availability - Availability data
   * @returns The updated therapist or null if there was an error
   */
  static async updateAvailability(id: string, availability: any): Promise<Therapist | null> {
    const { data, error } = await supabase
      .from('therapists')
      .update({ availability })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating therapist availability:', error);
      return null;
    }
    
    return data;
  }

  /**
   * List all therapists with pagination
   * @param page - Page number (starting from 0)
   * @param limit - Number of items per page
   * @returns Array of therapists
   */
  static async list(page: number = 0, limit: number = 10): Promise<Therapist[]> {
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error listing therapists:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Count total number of therapists
   * @returns Total count of therapists
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('therapists')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting therapists:', error);
      return 0;
    }
    
    return count || 0;
  }
}
