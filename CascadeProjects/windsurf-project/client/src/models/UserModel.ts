/**
 * User Model
 * 
 * Provides methods for interacting with the users table in Supabase.
 */

import { supabase } from '../services/supabaseClient';
import { User, InsertTables, UpdateTables } from '../types/supabase';

export class UserModel {
  /**
   * Get a user by ID
   * @param id - User ID
   * @returns The user or null if not found
   */
  static async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get a user by email
   * @param email - User email
   * @returns The user or null if not found
   */
  static async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Get users by role
   * @param role - User role (client, therapist, admin)
   * @returns Array of users with the specified role
   */
  static async getByRole(role: 'client' | 'therapist' | 'admin'): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role);
    
    if (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a new user
   * @param user - User data to insert
   * @returns The created user or null if there was an error
   */
  static async create(user: InsertTables<'users'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Update a user
   * @param id - User ID
   * @param updates - User data to update
   * @returns The updated user or null if there was an error
   */
  static async update(id: string, updates: UpdateTables<'users'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns True if successful, false otherwise
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    
    return true;
  }

  /**
   * List all users with pagination
   * @param page - Page number (starting from 0)
   * @param limit - Number of items per page
   * @returns Array of users
   */
  static async list(page: number = 0, limit: number = 10): Promise<User[]> {
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error listing users:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Count total number of users
   * @returns Total count of users
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting users:', error);
      return 0;
    }
    
    return count || 0;
  }
}
