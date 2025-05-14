/**
 * Client Model
 * 
 * Provides methods for interacting with the clients table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { Client, InsertTables, UpdateTables } from '../types/supabase';

export class ClientModel {
  /**
   * Get a client by ID
   * @param id - Client ID
   * @returns The client or null if not found
   */
  static async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get a client by user ID
   * @param userId - User ID
   * @returns The client or null if not found
   */
  static async getByUserId(userId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching client by user ID:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get clients by therapist ID
   * @param therapistId - Therapist ID
   * @returns Array of clients assigned to the therapist
   */
  static async getByTherapistId(therapistId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('therapist_id', therapistId);
    
    if (error) {
      console.error('Error fetching clients by therapist ID:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Get clients with full user data
   * @param filters - Optional filters to apply
   * @returns Array of clients with user data
   */
  static async getWithUserData(filters?: Record<string, any>): Promise<any[]> {
    let query = supabase
      .from('clients')
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
      console.error('Error fetching clients with user data:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new client
   * @param client - Client data to insert
   * @returns The created client or null if there was an error
   */
  static async create(client: InsertTables<'clients'>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a client
   * @param id - Client ID
   * @param updates - Client data to update
   * @returns The updated client or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'clients'>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a client
   * @param id - Client ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Assign a client to a therapist
   * @param clientId - Client ID
   * @param therapistId - Therapist ID
   * @returns The updated client or null if there was an error
   */
  static async assignToTherapist(clientId: string, therapistId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update({ therapist_id: therapistId })
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) {
      console.error('Error assigning client to therapist:', error);
      return null;
    }
    
    return data;
  }

  /**
   * List all clients with pagination
   * @param page - Page number (starting from 0)
   * @param limit - Number of items per page
   * @returns Array of clients
   */
  static async list(page: number = 0, limit: number = 10): Promise<Client[]> {
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error listing clients:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Count total number of clients
   * @returns Total count of clients
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting clients:', error);
      return 0;
    }
    
    return count || 0;
  }
}
