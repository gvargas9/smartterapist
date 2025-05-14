/**
 * Simple Supabase Connection Test
 * 
 * This script tests the basic connection to the Supabase database
 * without relying on complex policies.
 */

// Load environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://studio.gvargas.com/';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ3MTA4ODAwLCJleHAiOjE5MDQ4NzUyMDB9.Q7npnZSv__YCi4UKdUB34YrKj81gAKBlnRDxh75GfJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('Using Supabase URL:', supabaseUrl);

  try {
    // Simple query to check if we can connect
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      if (error.code === '42P01') {
        console.log('The users table does not exist yet. This is expected if you have not run the SQL setup script.');
        console.log('Please run the SQL setup script in the Supabase SQL editor.');
      } else {
        console.error('Error connecting to Supabase:', error);
      }
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Query result:', data);
    }

    // Try to sign up a test user
    console.log('\nTesting auth functionality...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('Auth error:', authError);
    } else {
      console.log('Successfully created a test user!');
      console.log('User ID:', authData.user?.id);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testConnection();
