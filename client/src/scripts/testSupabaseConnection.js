require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseProjectId = process.env.REACT_APP_SUPABASE_PROJECT_ID;

console.log('Testing Supabase connection with:');
console.log('URL:', supabaseUrl);
console.log('Project ID:', supabaseProjectId);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Try to get the current user session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Session data:', data);
    
    // Try to query a public table to further verify connection
    console.log('Attempting to query public schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .limit(5);
    
    if (schemaError) {
      console.error('Error querying schema:', schemaError.message);
    } else {
      console.log('Available public tables:', schemaData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testConnection();
