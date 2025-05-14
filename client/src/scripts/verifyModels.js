/**
 * Model Verification Script
 * 
 * This script verifies that our JavaScript models can be imported and used correctly.
 * It also tests basic database connectivity if possible.
 */

// Load environment variables
require('dotenv').config();

try {
  // Try to import the models
  console.log('Attempting to import models...');
  
  const models = require('./models');
  
  console.log('Successfully imported models!');
  console.log('Available models:');
  
  // List all available models
  Object.keys(models).forEach(modelName => {
    if (modelName === 'supabase') return; // Skip the supabase client
    
    console.log(`- ${modelName}`);
    
    // Check if the model has the expected methods
    const model = models[modelName];
    const methods = Object.getOwnPropertyNames(model)
      .filter(prop => typeof model[prop] === 'function');
    
    console.log(`  Methods: ${methods.join(', ')}`);
  });
  
  // Test database connection
  console.log('\nTesting database connection...');
  
  const testConnection = async () => {
    try {
      // Simple query to check if we can connect
      const { data, error } = await models.supabase
        .from('users')
        .select('count');
      
      if (error) {
        if (error.code === '42P01') {
          console.log('The users table does not exist yet. This is expected if you have not run the SQL setup script.');
          console.log('Please run the SQL setup script in the Supabase SQL editor.');
        } else if (error.code === '42P17') {
          console.log('Infinite recursion detected in policy for relation "users".');
          console.log('This is a known issue with the RLS policies. Please run the fix_policies.sql script in your Supabase SQL editor.');
        } else {
          console.error('Error connecting to Supabase:', error);
        }
      } else {
        console.log('Successfully connected to Supabase!');
        console.log('Query result:', data);
      }
      
      console.log('\nModel verification completed!');
    } catch (err) {
      console.error('Unexpected error during database test:', err);
    }
  };
  
  testConnection();
  
} catch (error) {
  console.error('Error importing models:', error);
}
