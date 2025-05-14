// Script to set up mock users in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock user credentials
const mockUsers = [
  {
    email: 'client@example.com',
    password: 'password123',
    role: 'client',
    name: 'Jane Smith',
    id: 'client-1'
  },
  {
    email: 'therapist@example.com',
    password: 'password123',
    role: 'therapist',
    name: 'Dr. Lee Wong',
    id: 'therapist-1'
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    name: 'Admin User',
    id: 'admin-1'
  }
];

async function setupMockUsers() {
  console.log('Setting up mock users...');
  
  for (const user of mockUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email);
        
      if (checkError) {
        console.error(`Error checking if user ${user.email} exists:`, checkError);
        continue;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Register user with Supabase Auth
      console.log(`Registering user ${user.email}...`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            role: user.role,
            name: user.name
          }
        }
      });
      
      if (authError) {
        console.error(`Error registering user ${user.email}:`, authError);
        continue;
      }
      
      console.log(`User ${user.email} registered successfully with ID: ${authData.user.id}`);
      
      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            created_at: new Date().toISOString(),
            profile_data: {
              name: user.name
            }
          }
        ]);
        
      if (profileError) {
        console.error(`Error creating profile for user ${user.email}:`, profileError);
        continue;
      }
      
      console.log(`Profile created for user ${user.email}`);
      
      // Create role-specific records
      if (user.role === 'client') {
        const { error: clientError } = await supabase
          .from('clients')
          .insert([
            {
              user_id: authData.user.id,
              profile_data: {
                name: user.name,
                age: 32,
                concerns: ['Anxiety', 'Work stress'],
                goals: ['Improve coping skills', 'Better work-life balance']
              }
            }
          ]);
          
        if (clientError) {
          console.error(`Error creating client record for user ${user.email}:`, clientError);
        } else {
          console.log(`Client record created for user ${user.email}`);
        }
      } else if (user.role === 'therapist') {
        const { error: therapistError } = await supabase
          .from('therapists')
          .insert([
            {
              user_id: authData.user.id,
              credentials: {
                license: 'PSY12345',
                education: 'Ph.D. Clinical Psychology, Stanford University',
                years_experience: 12
              },
              availability: {
                monday: ['9:00', '10:00', '11:00', '13:00', '14:00'],
                tuesday: ['9:00', '10:00', '11:00', '13:00', '14:00'],
                wednesday: ['9:00', '10:00', '11:00', '13:00', '14:00'],
                thursday: ['9:00', '10:00', '11:00', '13:00', '14:00'],
                friday: ['9:00', '10:00', '11:00', '13:00', '14:00']
              }
            }
          ]);
          
        if (therapistError) {
          console.error(`Error creating therapist record for user ${user.email}:`, therapistError);
        } else {
          console.log(`Therapist record created for user ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`Unexpected error setting up user ${user.email}:`, error);
    }
  }
  
  console.log('Mock user setup complete!');
}

// Run the script
setupMockUsers()
  .catch(error => {
    console.error('Error in setup script:', error);
  });
