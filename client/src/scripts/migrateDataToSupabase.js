/**
 * Script to migrate mock data from devMode.js to Supabase
 * 
 * This script takes all the mock data defined in devMode.js and creates
 * corresponding records in Supabase tables.
 */

import { supabase } from '../services/supabaseClient';
import { MOCK_USERS, MOCK_DATA } from '../utils/devMode';

/**
 * Main migration function
 */
const migrateDataToSupabase = async () => {
  try {
    console.log('Starting data migration to Supabase...');
    
    // Migrate users
    await migrateUsers();
    
    // Migrate clients
    await migrateClients();
    
    // Migrate behaviors
    await migrateBehaviors();
    
    // Migrate sessions
    await migrateSessions();
    
    // Migrate summaries
    await migrateSummaries();
    
    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
  }
};

/**
 * Migrate user data
 */
const migrateUsers = async () => {
  console.log('Migrating users...');
  
  const users = Object.values(MOCK_USERS);
  
  // First check if users already exist to avoid duplicates
  for (const user of users) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!existingUser) {
      // Create the user auth record if it doesn't exist
      // Note: In a real app, you'd use auth.admin methods, but for this demo we'll insert directly
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          profile_data: user.profile_data,
          created_at: user.created_at
        });
      
      if (insertError) {
        console.error(`Error inserting user ${user.id}:`, insertError);
      } else {
        console.log(`User ${user.id} created successfully`);
      }
    } else {
      console.log(`User ${user.id} already exists, skipping`);
    }
  }
};

/**
 * Migrate client data
 */
const migrateClients = async () => {
  console.log('Migrating clients...');
  
  for (const client of MOCK_DATA.clients) {
    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client.id)
      .single();
    
    if (!existingClient) {
      // Create client record
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          id: client.id,
          user_id: client.users?.id || client.id, // Link to user if available
          name: client.users?.profile_data?.name || client.name,
          email: client.email,
          last_session: client.last_session,
          next_session: client.next_session
        });
      
      if (insertError) {
        console.error(`Error inserting client ${client.id}:`, insertError);
      } else {
        console.log(`Client ${client.id} created successfully`);
        
        // If client has behaviors, create client_behaviors records
        if (client.client_behaviors && client.client_behaviors.length > 0) {
          for (const behavior of client.client_behaviors) {
            const { error: behaviorError } = await supabase
              .from('client_behaviors')
              .insert({
                client_id: client.id,
                behavior_id: behavior.id
              });
            
            if (behaviorError) {
              console.error(`Error linking behavior ${behavior.id} to client ${client.id}:`, behaviorError);
            }
          }
        }
      }
    } else {
      console.log(`Client ${client.id} already exists, skipping`);
    }
  }
};

/**
 * Migrate behavior data
 */
const migrateBehaviors = async () => {
  console.log('Migrating behaviors...');
  
  for (const behavior of MOCK_DATA.behaviors) {
    // Check if behavior already exists
    const { data: existingBehavior } = await supabase
      .from('behaviors')
      .select('id')
      .eq('id', behavior.id)
      .single();
    
    if (!existingBehavior) {
      // Create behavior record
      const { error: insertError } = await supabase
        .from('behaviors')
        .insert({
          id: behavior.id,
          name: behavior.name,
          description: behavior.description,
          created_at: behavior.created_at,
          prompt_template: behavior.prompt_template || null
        });
      
      if (insertError) {
        console.error(`Error inserting behavior ${behavior.id}:`, insertError);
      } else {
        console.log(`Behavior ${behavior.id} created successfully`);
      }
    } else {
      console.log(`Behavior ${behavior.id} already exists, skipping`);
    }
  }
};

/**
 * Migrate session data
 */
const migrateSessions = async () => {
  console.log('Migrating sessions...');
  
  for (const session of MOCK_DATA.sessions) {
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', session.id)
      .single();
    
    if (!existingSession) {
      // Create session record
      const { error: insertError } = await supabase
        .from('sessions')
        .insert({
          id: session.id,
          client_id: session.client_id,
          start_time: session.start_time,
          end_time: session.end_time
        });
      
      if (insertError) {
        console.error(`Error inserting session ${session.id}:`, insertError);
      } else {
        console.log(`Session ${session.id} created successfully`);
      }
    } else {
      console.log(`Session ${session.id} already exists, skipping`);
    }
  }
};

/**
 * Migrate summary data
 */
const migrateSummaries = async () => {
  console.log('Migrating summaries...');
  
  for (const summary of MOCK_DATA.summaries) {
    // Check if summary already exists
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('id')
      .eq('id', summary.id)
      .single();
    
    if (!existingSummary) {
      // Create summary record
      const { error: insertError } = await supabase
        .from('summaries')
        .insert({
          id: summary.id,
          conversation_id: summary.conversation_id,
          summary_text: summary.summary_text,
          created_at: summary.created_at,
          sentiment_metrics: summary.sentiment_metrics
        });
      
      if (insertError) {
        console.error(`Error inserting summary ${summary.id}:`, insertError);
      } else {
        console.log(`Summary ${summary.id} created successfully`);
      }
    } else {
      console.log(`Summary ${summary.id} already exists, skipping`);
    }
  }
};

// Execute the migration
migrateDataToSupabase();

export default migrateDataToSupabase;
