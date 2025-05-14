// Test Supabase Connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Print environment variables for debugging (without showing full key)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const maskedKey = supabaseKey ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 5)}` : 'undefined';

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('Original Supabase URL:', supabaseUrl);
console.log('Supabase Key (masked):', maskedKey);

// Check URL format and try to correct if needed
let correctedUrl = supabaseUrl;

// If URL ends with slash, remove it
if (correctedUrl && correctedUrl.endsWith('/')) {
  correctedUrl = correctedUrl.slice(0, -1);
  console.log('Removed trailing slash from URL');
}

// Check if URL contains 'project/default'
if (correctedUrl && correctedUrl.includes('project/default')) {
  console.log('WARNING: URL contains "project/default" which is unusual for Supabase');
  console.log('Standard Supabase URL format is: https://[project-id].supabase.co');
  
  // Try to extract project ID if possible
  const urlParts = correctedUrl.split('/');
  const potentialProjectId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
  console.log('Potential project ID:', potentialProjectId);
}

console.log('Using URL for connection:', correctedUrl);

// Try multiple URL formats if needed
const urlsToTry = [correctedUrl];

// If URL is studio.gvargas.com, it might be a custom domain
// Let's add a test with standard Supabase format as well
if (correctedUrl && correctedUrl.includes('studio.gvargas.com')) {
  const alternativeUrl = 'https://gvargas.supabase.co';
  urlsToTry.push(alternativeUrl);
  console.log('Will also try standard Supabase URL format:', alternativeUrl);
}

// Create Supabase client with the primary URL
const supabase = createClient(correctedUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Also create an alternative client if we have multiple URLs to try
let altSupabase = null;
if (urlsToTry.length > 1) {
  altSupabase = createClient(urlsToTry[1], supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

async function testSupabaseConnection() {
  console.log('\n=== TESTING PRIMARY URL CONNECTION ===');
  let primarySuccess = false;
  
  try {
    // Test 1: Check authentication status with primary URL
    console.log('Test 1: Checking authentication status...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error:', authError.message);
    } else {
      console.log('✅ Authentication check successful!');
      console.log('Session:', authData);
      primarySuccess = true;
    }
    
    // Test 2: Try to create a test table
    console.log('\nTest 2: Testing database access...');
    
    // Try to get the Supabase version (works on most instances)
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_server_version')
      .single();
      
    if (versionError) {
      console.log('Could not get server version:', versionError.message);
      
      // Try to list tables as an alternative
      console.log('Trying to list tables instead...');
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public')
        .limit(5);
        
      if (tablesError) {
        console.log('Could not list tables:', tablesError.message);
        
        // Try one more approach - simple storage bucket list
        console.log('Trying storage bucket list...');
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .listBuckets();
          
        if (bucketError) {
          console.log('Could not list storage buckets:', bucketError.message);
          console.log('❌ Database access tests failed');
        } else {
          console.log('✅ Successfully listed storage buckets:', bucketData);
          primarySuccess = true;
        }
      } else {
        console.log('✅ Successfully listed tables:');
        console.table(tablesData);
        primarySuccess = true;
      }
    } else {
      console.log('✅ Successfully got server version:', versionData);
      primarySuccess = true;
    }
  } catch (err) {
    console.error('Unexpected error with primary URL:', err.message);
  }
  
  // If we have an alternative URL to try and the primary one failed
  if (altSupabase && !primarySuccess) {
    console.log('\n=== TESTING ALTERNATIVE URL CONNECTION ===');
    console.log('Trying alternative URL:', urlsToTry[1]);
    
    try {
      // Test with alternative URL
      const { data: altAuthData, error: altAuthError } = await altSupabase.auth.getSession();
      
      if (altAuthError) {
        console.error('Alternative URL authentication error:', altAuthError.message);
      } else {
        console.log('✅ Alternative URL authentication successful!');
        console.log('Session:', altAuthData);
        
        // Try to list buckets with alternative URL
        const { data: altBucketData, error: altBucketError } = await altSupabase
          .storage
          .listBuckets();
          
        if (altBucketError) {
          console.log('Could not list storage buckets with alternative URL:', altBucketError.message);
        } else {
          console.log('✅ Successfully listed storage buckets with alternative URL:', altBucketData);
        }
      }
    } catch (err) {
      console.error('Unexpected error with alternative URL:', err.message);
    }
  }
  
  // Print summary
  console.log('\n=== CONNECTION TEST SUMMARY ===');
  if (primarySuccess) {
    console.log('✅ Supabase connection successful with URL:', correctedUrl);
    console.log('Your Supabase configuration is working correctly!');
  } else if (altSupabase) {
    console.log('❌ Primary URL connection failed');
    console.log('Tried alternative URL:', urlsToTry[1]);
    console.log('\nSUGGESTION: Check your Supabase URL format. It should be in the format:');
    console.log('https://[project-id].supabase.co');
  } else {
    console.log('❌ Supabase connection failed');
    console.log('\nPossible issues:');
    console.log('1. Incorrect Supabase URL format');
    console.log('2. Invalid or expired API key');
    console.log('3. Network connectivity issues');
    console.log('4. Supabase service might be down');
    console.log('\nPlease check your Supabase project settings at https://app.supabase.com');
  }
}

// Run the test
testSupabaseConnection();
