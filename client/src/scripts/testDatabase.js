/**
 * Supabase Database Test Script
 * 
 * This script tests the connection to the Supabase database and performs
 * basic CRUD operations on the tables we've created.
 */

// Load environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://studio.gvargas.com/';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ3MTA4ODAwLCJleHAiOjE5MDQ4NzUyMDB9.Q7npnZSv__YCi4UKdUB34YrKj81gAKBlnRDxh75GfJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Starting database tests...');
  console.log('Using Supabase URL:', supabaseUrl);

  try {
    // Test 1: Check connection and list tables
    console.log('\n--- Test 1: Check connection and list tables ---');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'pg_stat_statements')
      .order('table_name');
    
    if (tablesError) {
      console.log('Error querying tables:', tablesError);
      
      // Try a simpler query to check connection
      const { data, error } = await supabase.from('users').select('count');
      if (error) {
        throw new Error(`Connection error: ${error.message}`);
      } else {
        console.log('Connection successful but could not list tables. Users table exists.');
      }
    } else {
      console.log('Connection successful!');
      console.log('Available tables:', tablesData.map(t => t.table_name).join(', '));
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: testEmail,
        role: 'admin',
        first_name: 'Test',
        last_name: 'User'
      })
      .select()
      .single();
    
    if (userError) {
      throw new Error(`Error creating user record: ${userError.message}`);
    }
    
    console.log('User record created:', userData);

    // Test 4: Create a therapist record
    console.log('\n--- Test 4: Create a therapist record ---');
    const { data: therapistData, error: therapistError } = await supabase
      .from('therapists')
      .insert({
        user_id: userId,
        specialties: ['Anxiety', 'Depression'],
        credentials: { degree: 'Ph.D', license: 'LPC-123' },
        availability: { monday: ['9:00-12:00', '13:00-17:00'] }
      })
      .select()
      .single();
    
    if (therapistError) {
      throw new Error(`Error creating therapist record: ${therapistError.message}`);
    }
    
    console.log('Therapist record created:', therapistData);

    // Test 5: Create a client record
    console.log('\n--- Test 5: Create a client record ---');
    // Create another user for the client
    const clientEmail = `client_${Date.now()}@example.com`;
    const { data: clientAuthData, error: clientAuthError } = await supabase.auth.signUp({
      email: clientEmail,
      password: testPassword
    });
    
    if (clientAuthError || !clientAuthData.user) {
      throw new Error(`Client auth error: ${clientAuthError?.message || 'No user returned'}`);
    }
    
    const clientUserId = clientAuthData.user.id;
    
    // Create user record for the client
    const { data: clientUserData, error: clientUserError } = await supabase
      .from('users')
      .insert({
        id: clientUserId,
        email: clientEmail,
        role: 'client',
        first_name: 'Test',
        last_name: 'Client'
      })
      .select()
      .single();
    
    if (clientUserError) {
      throw new Error(`Error creating client user record: ${clientUserError.message}`);
    }
    
    // Create client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: clientUserId,
        therapist_id: therapistData.id,
        profile_data: { age: 30, concerns: ['Stress', 'Anxiety'] }
      })
      .select()
      .single();
    
    if (clientError) {
      throw new Error(`Error creating client record: ${clientError.message}`);
    }
    
    console.log('Client record created:', clientData);

    // Test 6: Create a therapy session
    console.log('\n--- Test 6: Create a therapy session ---');
    const now = new Date();
    const sessionStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('therapy_sessions')
      .insert({
        client_id: clientData.id,
        therapist_id: therapistData.id,
        session_type: 'initial',
        scheduled_start: sessionStart.toISOString(),
        scheduled_end: sessionEnd.toISOString()
      })
      .select()
      .single();
    
    if (sessionError) {
      throw new Error(`Error creating therapy session: ${sessionError.message}`);
    }
    
    console.log('Therapy session created:', sessionData);

    // Test 7: Create a message
    console.log('\n--- Test 7: Create a message ---');
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        recipient_id: clientUserId,
        content: 'Hello, this is a test message!'
      })
      .select()
      .single();
    
    if (messageError) {
      throw new Error(`Error creating message: ${messageError.message}`);
    }
    
    console.log('Message created:', messageData);

    // Test 8: Create a behavior record
    console.log('\n--- Test 8: Create a behavior record ---');
    const { data: behaviorData, error: behaviorError } = await supabase
      .from('behavior_records')
      .insert({
        client_id: clientData.id,
        behavior_type: 'Anxiety',
        severity: 5,
        recorded_at: new Date().toISOString(),
        notes: 'Test behavior record'
      })
      .select()
      .single();
    
    if (behaviorError) {
      throw new Error(`Error creating behavior record: ${behaviorError.message}`);
    }
    
    console.log('Behavior record created:', behaviorData);

    // Test 9: Fetch data with relationships
    console.log('\n--- Test 9: Fetch data with relationships ---');
    const { data: clientWithRelations, error: relationsError } = await supabase
      .from('clients')
      .select(`
        *,
        users:user_id (*),
        therapists:therapist_id (*)
      `)
      .eq('id', clientData.id)
      .single();
    
    if (relationsError) {
      throw new Error(`Error fetching client with relationships: ${relationsError.message}`);
    }
    
    console.log('Client with relationships:', clientWithRelations);

    // Test 10: Clean up (optional - comment out if you want to keep the test data)
    console.log('\n--- Test 10: Clean up ---');
    await supabase.from('behavior_records').delete().eq('id', behaviorData.id);
    await supabase.from('messages').delete().eq('id', messageData.id);
    await supabase.from('therapy_sessions').delete().eq('id', sessionData.id);
    await supabase.from('clients').delete().eq('id', clientData.id);
    await supabase.from('therapists').delete().eq('id', therapistData.id);
    await supabase.from('users').delete().eq('id', clientUserId);
    await supabase.from('users').delete().eq('id', userId);
    
    console.log('All test data cleaned up');

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
testDatabase();
