/**
 * Supabase Database Test Script
 * 
 * This script tests the connection to the Supabase database and performs
 * basic CRUD operations on the tables we've created.
 */

// Load environment variables
require('dotenv').config();

// Import Supabase client
const { supabase } = require('../services/supabaseClient');

// Add empty export to make TypeScript treat this as a module
export {};

// Define interfaces for our database models
namespace Models {
  export interface User {
    id: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface Client {
    id: string;
    user_id: string;
    therapist_id?: string;
    profile_data?: any;
    created_at?: string;
    updated_at?: string;
  }

  export interface Therapist {
    id: string;
    user_id: string;
    specialties?: string[];
    credentials?: any;
    availability?: any;
    created_at?: string;
    updated_at?: string;
  }

  export interface TherapySession {
    id: string;
    client_id: string;
    therapist_id: string;
    session_type?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface BehaviorRecord {
    id: string;
    client_id: string;
    behavior_type: string;
    severity?: number;
    recorded_at?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
  }
}

// Define service classes for database operations
namespace Services {
  export class UserService {
    static async create(userData: Partial<Models.User>): Promise<Models.User | null> {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating user: ${error.message}`);
      return data;
    }

    static async getById(id: string): Promise<Models.User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(`Error fetching user: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  export class ClientService {
    static async create(clientData: Partial<Models.Client>): Promise<Models.Client | null> {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating client: ${error.message}`);
      return data;
    }

    static async getByUserId(userId: string): Promise<Models.Client | null> {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw new Error(`Error fetching client: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting client: ${error.message}`);
    }
  }

  export class TherapistService {
    static async create(therapistData: Partial<Models.Therapist>): Promise<Models.Therapist | null> {
      const { data, error } = await supabase
        .from('therapists')
        .insert(therapistData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating therapist: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('therapists')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting therapist: ${error.message}`);
    }
  }

  export class TherapySessionService {
    static async create(sessionData: Partial<Models.TherapySession>): Promise<Models.TherapySession | null> {
      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert(sessionData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating therapy session: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('therapy_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting therapy session: ${error.message}`);
    }
  }

  export class MessageService {
    static async create(messageData: Partial<Models.Message>): Promise<Models.Message | null> {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating message: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting message: ${error.message}`);
    }
  }

  export class BehaviorRecordService {
    static async create(recordData: Partial<Models.BehaviorRecord>): Promise<Models.BehaviorRecord | null> {
      const { data, error } = await supabase
        .from('behavior_records')
        .insert(recordData)
        .select()
        .single();
      
      if (error) throw new Error(`Error creating behavior record: ${error.message}`);
      return data;
    }

    static async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('behavior_records')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Error deleting behavior record: ${error.message}`);
    }
  }
}

async function testDatabase() {
  console.log('Starting database tests...');
  console.log('Using Supabase URL:', process.env.REACT_APP_SUPABASE_URL);

  try {
    // Test 1: Check connection
    console.log('\n--- Test 1: Check connection ---');
    
    // Use a simpler method to check connection - just ping the server
    const { data, error } = await supabase.rpc('ping');
    
    if (error) {
      // If the ping RPC doesn't exist, try a different approach
      console.log('Ping RPC not available, trying alternative connection test...');
      
      // Try to get the server version
      const { data: healthData, error: healthError } = await supabase.from('_health').select('*').limit(1);
      
      if (healthError) {
        // If health check fails, try one more approach - auth API
        console.log('Health check failed, trying auth API...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw new Error(`Connection error: ${authError.message}`);
        }
        
        console.log('Connection successful via auth API!');
      } else {
        console.log('Connection successful via health check!');
      }
    } else {
      console.log('Connection successful via ping RPC!');
    }
    
    // Try to list some tables if possible
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (!tablesError && tablesData) {
        console.log('Available tables:', tablesData.map((t: { table_name: string }) => t.table_name).join(', '));
      }
    } catch (e) {
      console.log('Could not list tables, but connection is working');
    }

    // Test 2: Sign up a test user
    console.log('\n--- Test 2: Sign up a test user ---');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }
    
    if (!authData.user) {
      throw new Error('No user returned from sign up');
    }
    
    const userId = authData.user.id;
    console.log('Test user created with ID:', userId);

    // Test 3: Create a user record
    console.log('\n--- Test 3: Create a user record ---');
    const userData = {
      id: userId,
      email: testEmail,
      role: 'client',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const user = await Services.UserService.create(userData);
    
    if (!user) {
      throw new Error('Failed to create user record');
    }
    
    console.log('User record created:', user);

    // Test 4: Create a therapist record
    console.log('\n--- Test 4: Create a therapist record ---');
    const therapistData = {
      user_id: userId,
      specialties: ['Anxiety', 'Depression'],
      credentials: { degree: 'Ph.D', license: 'LPC-123' },
      availability: { monday: ['9:00-12:00', '13:00-17:00'] }
    };
    
    const therapist = await Services.TherapistService.create(therapistData);
    
    if (!therapist) {
      throw new Error('Failed to create therapist record');
    }
    
    console.log('Therapist record created:', therapist);

    // Test 5: Create a client
    console.log('\n--- Test 5: Create a client ---');
    const clientData = {
      user_id: userId,
      therapist_id: therapist.id,
      profile_data: { interests: ['Anxiety management', 'Stress reduction'] }
    };
    
    const client = await Services.ClientService.create(clientData);
    
    if (!client) {
      throw new Error('Failed to create client record');
    }
    
    console.log('Client record created:', client);

    // Test 6: Create a therapy session
    console.log('\n--- Test 6: Create a therapy session ---');
    const sessionData = {
      client_id: client.id,
      therapist_id: therapist.id,
      session_type: 'Initial consultation',
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 3600000).toISOString()
    };
    
    const session = await Services.TherapySessionService.create(sessionData);
    
    if (!session) {
      throw new Error('Failed to create therapy session');
    }
    
    console.log('Therapy session created:', session);

    // Test 7: Create a message
    console.log('\n--- Test 7: Create a message ---');
    const messageData = {
      sender_id: userId, // Use the same user ID for sender and recipient in this test
      recipient_id: userId, // In a real app, this would be a different user
      content: 'Hello, this is a test message from your therapist.'
    };
    
    const message = await Services.MessageService.create(messageData);
    
    if (!message) {
      throw new Error('Failed to create message');
    }
    
    console.log('Message created:', message);

    // Test 8: Create a behavior record
    console.log('\n--- Test 8: Create a behavior record ---');
    const behaviorData = {
      client_id: client.id,
      behavior_type: 'Anxiety',
      severity: 3,
      recorded_at: new Date().toISOString(),
      notes: 'Patient reported feeling anxious during work meetings'
    };
    
    const behaviorRecord = await Services.BehaviorRecordService.create(behaviorData);
    
    if (!behaviorRecord) {
      throw new Error('Failed to create behavior record');
    }
    
    console.log('Behavior record created:', behaviorRecord);

    // Test 9: Fetch data with relationships
    console.log('\n--- Test 9: Fetch data with relationships ---');
    const clientWithTherapist = await supabase
      .from('clients')
      .select(`
        *,
        users:user_id (*),
        therapists:therapist_id (*)
      `)
      .eq('id', client.id)
      .single();
    
    if (clientWithTherapist.error) {
      throw new Error(`Error fetching client with relationships: ${clientWithTherapist.error.message}`);
    }
    
    console.log('Client with relationships:', clientWithTherapist.data);

    // Test 10: Clean up (optional - comment out if you want to keep the test data)
    console.log('\n--- Test 10: Clean up ---');
    await Services.BehaviorRecordService.delete(behaviorRecord.id);
    await Services.MessageService.delete(message.id);
    await Services.TherapySessionService.delete(session.id);
    await Services.ClientService.delete(client.id);
    await Services.TherapistService.delete(therapist.id);
    // We only have one user in this test now, so we just delete the main userId
    await Services.UserService.delete(userId);
    
    console.log('All test data cleaned up');

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : String(error));
  }
}

// Run the tests
testDatabase();
