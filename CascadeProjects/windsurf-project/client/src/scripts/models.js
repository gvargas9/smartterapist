/**
 * JavaScript Models for Node.js Scripts
 * 
 * This file provides JavaScript versions of our TypeScript models
 * that can be imported directly by Node.js scripts without transpilation.
 */

// Load environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://studio.gvargas.com/';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ3MTA4ODAwLCJleHAiOjE5MDQ4NzUyMDB9.Q7npnZSv__YCi4UKdUB34YrKj81gAKBlnRDxh75GfJk';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * User Model
 */
class UserModel {
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<object|null>} The user or null if not found
   */
  static async getById(id) {
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
   * Create a new user
   * @param {object} user - User data to insert
   * @returns {Promise<object|null>} The created user or null if there was an error
   */
  static async create(user) {
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
   * @param {string} id - User ID
   * @param {object} updates - User data to update
   * @returns {Promise<object|null>} The updated user or null if there was an error
   */
  static async update(id, updates) {
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
}

/**
 * Client Model
 */
class ClientModel {
  /**
   * Get a client by ID
   * @param {string} id - Client ID
   * @returns {Promise<object|null>} The client or null if not found
   */
  static async getById(id) {
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
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} The client or null if not found
   */
  static async getByUserId(userId) {
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
   * Create a new client
   * @param {object} client - Client data to insert
   * @returns {Promise<object|null>} The created client or null if there was an error
   */
  static async create(client) {
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
}

/**
 * Therapist Model
 */
class TherapistModel {
  /**
   * Get a therapist by ID
   * @param {string} id - Therapist ID
   * @returns {Promise<object|null>} The therapist or null if not found
   */
  static async getById(id) {
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
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} The therapist or null if not found
   */
  static async getByUserId(userId) {
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
   * Create a new therapist
   * @param {object} therapist - Therapist data to insert
   * @returns {Promise<object|null>} The created therapist or null if there was an error
   */
  static async create(therapist) {
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
}

module.exports = {
  UserModel,
  ClientModel,
  TherapistModel,
  supabase
};
