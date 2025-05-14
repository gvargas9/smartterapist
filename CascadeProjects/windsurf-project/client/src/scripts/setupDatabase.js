/**
 * Supabase Database Setup Script
 * 
 * This script creates the necessary tables and relationships for the SmartTherapist application.
 * Run this script once to initialize your Supabase database schema.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with your self-hosted server
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://studio.gvargas.com/';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ3MTA4ODAwLCJleHAiOjE5MDQ4NzUyMDB9.Q7npnZSv__YCi4UKdUB34YrKj81gAKBlnRDxh75GfJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Starting database setup...');

  try {
    // Enable UUID extension if not already enabled
    console.log('Enabling UUID extension...');
    const { error: uuidError } = await supabase.from('_exec_sql').insert({
      query: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    });
    
    if (uuidError) {
      console.log('Note: UUID extension might already be enabled or requires admin privileges');
      console.log(uuidError);
    }
    
    // Create users table (extends Supabase auth.users)
    console.log('Setting up users table...');
    const { error: usersError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          email TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('client', 'therapist', 'admin')),
          first_name TEXT,
          last_name TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create RLS policies for users table
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to view and edit their own data
        CREATE POLICY "Users can view own data" 
          ON public.users 
          FOR SELECT 
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can update own data" 
          ON public.users 
          FOR UPDATE 
          USING (auth.uid() = id);
          
        -- Policy for admins to manage all users
        CREATE POLICY "Admins can do anything" 
          ON public.users 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
      // Continue with other tables even if this one fails
    }

    // Create clients table
    console.log('Setting up clients table...');
    const { error: clientsError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.clients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          therapist_id UUID REFERENCES public.therapists(id),
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
          intake_completed BOOLEAN DEFAULT false,
          profile_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
        
        -- Create RLS policies for clients table
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
        
        -- Policy for clients to view their own data
        CREATE POLICY "Clients can view own data" 
          ON public.clients 
          FOR SELECT 
          USING (auth.uid() = user_id);
          
        -- Policy for therapists to view their assigned clients
        CREATE POLICY "Therapists can view assigned clients" 
          ON public.clients 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.therapists 
              WHERE user_id = auth.uid() AND id = therapist_id
            )
          );
          
        -- Policy for admins to manage all clients
        CREATE POLICY "Admins can do anything with clients" 
          ON public.clients 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (clientsError) {
      console.error('Error creating clients table:', clientsError);
      // Continue with other tables even if this one fails
    }

    // Create therapists table
    console.log('Setting up therapists table...');
    const { error: therapistsError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.therapists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          specialties TEXT[],
          credentials JSONB DEFAULT '{}'::jsonb,
          availability JSONB DEFAULT '{}'::jsonb,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
        
        -- Create RLS policies for therapists table
        ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
        
        -- Policy for therapists to view and edit their own data
        CREATE POLICY "Therapists can view own data" 
          ON public.therapists 
          FOR SELECT 
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Therapists can update own data" 
          ON public.therapists 
          FOR UPDATE 
          USING (auth.uid() = user_id);
          
        -- Policy for clients to view their assigned therapist
        CREATE POLICY "Clients can view assigned therapist" 
          ON public.therapists 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.clients 
              WHERE user_id = auth.uid() AND therapist_id = id
            )
          );
          
        -- Policy for admins to manage all therapists
        CREATE POLICY "Admins can do anything with therapists" 
          ON public.therapists 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (therapistsError) {
      console.error('Error creating therapists table:', therapistsError);
      // Continue with other tables even if this one fails
    }

    // Create sessions table
    console.log('Setting up therapy sessions table...');
    const { error: sessionsError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.therapy_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
          session_type TEXT NOT NULL CHECK (session_type IN ('initial', 'follow-up', 'emergency', 'group')),
          scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
          scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
          actual_start TIMESTAMP WITH TIME ZONE,
          actual_end TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create RLS policies for therapy_sessions table
        ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Policy for clients to view their own sessions
        CREATE POLICY "Clients can view own sessions" 
          ON public.therapy_sessions 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.clients 
              WHERE user_id = auth.uid() AND id = client_id
            )
          );
          
        -- Policy for therapists to manage sessions they're assigned to
        CREATE POLICY "Therapists can manage assigned sessions" 
          ON public.therapy_sessions 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.therapists 
              WHERE user_id = auth.uid() AND id = therapist_id
            )
          );
          
        -- Policy for admins to manage all sessions
        CREATE POLICY "Admins can do anything with sessions" 
          ON public.therapy_sessions 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (sessionsError) {
      console.error('Error creating therapy_sessions table:', sessionsError);
      // Continue with other tables even if this one fails
    }

    // Create messages table
    console.log('Setting up messages table...');
    const { error: messagesError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create RLS policies for messages table
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to view messages they sent or received
        CREATE POLICY "Users can view own messages" 
          ON public.messages 
          FOR SELECT 
          USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
          
        -- Policy for users to insert messages they're sending
        CREATE POLICY "Users can send messages" 
          ON public.messages 
          FOR INSERT 
          WITH CHECK (auth.uid() = sender_id);
          
        -- Policy for users to update messages they received (e.g., mark as read)
        CREATE POLICY "Users can update received messages" 
          ON public.messages 
          FOR UPDATE 
          USING (auth.uid() = recipient_id);
          
        -- Policy for admins to manage all messages
        CREATE POLICY "Admins can do anything with messages" 
          ON public.messages 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
      // Continue with other tables even if this one fails
    }

    // Create behavior_records table
    console.log('Setting up behavior records table...');
    const { error: behaviorError } = await supabase.from('_exec_sql').insert({
      query: `
        CREATE TABLE IF NOT EXISTS public.behavior_records (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
          behavior_type TEXT NOT NULL,
          severity INTEGER CHECK (severity BETWEEN 1 AND 10),
          duration INTEGER, -- in minutes
          trigger TEXT,
          notes TEXT,
          recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create RLS policies for behavior_records table
        ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;
        
        -- Policy for clients to view and manage their own behavior records
        CREATE POLICY "Clients can manage own behavior records" 
          ON public.behavior_records 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.clients 
              WHERE user_id = auth.uid() AND id = client_id
            )
          );
          
        -- Policy for therapists to view behavior records of their clients
        CREATE POLICY "Therapists can view client behavior records" 
          ON public.behavior_records 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.clients c
              JOIN public.therapists t ON c.therapist_id = t.id
              WHERE t.user_id = auth.uid() AND c.id = client_id
            )
          );
          
        -- Policy for admins to manage all behavior records
        CREATE POLICY "Admins can do anything with behavior records" 
          ON public.behavior_records 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (behaviorError) {
      console.error('Error creating behavior_records table:', behaviorError);
      // Continue with other tables even if this one fails
    }

    // Create functions and triggers for updated_at timestamps
    console.log('Setting up timestamp triggers...');
    const { error: triggerError } = await supabase.from('_exec_sql').insert({
      query: `
        -- Function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create triggers for all tables
        DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
        CREATE TRIGGER update_users_timestamp
          BEFORE UPDATE ON public.users
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          
        DROP TRIGGER IF EXISTS update_clients_timestamp ON public.clients;
        CREATE TRIGGER update_clients_timestamp
          BEFORE UPDATE ON public.clients
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          
        DROP TRIGGER IF EXISTS update_therapists_timestamp ON public.therapists;
        CREATE TRIGGER update_therapists_timestamp
          BEFORE UPDATE ON public.therapists
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          
        DROP TRIGGER IF EXISTS update_therapy_sessions_timestamp ON public.therapy_sessions;
        CREATE TRIGGER update_therapy_sessions_timestamp
          BEFORE UPDATE ON public.therapy_sessions
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          
        DROP TRIGGER IF EXISTS update_messages_timestamp ON public.messages;
        CREATE TRIGGER update_messages_timestamp
          BEFORE UPDATE ON public.messages
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          
        DROP TRIGGER IF EXISTS update_behavior_records_timestamp ON public.behavior_records;
        CREATE TRIGGER update_behavior_records_timestamp
          BEFORE UPDATE ON public.behavior_records
          FOR EACH ROW EXECUTE FUNCTION update_timestamp();
      `
    });

    if (triggerError) {
      console.error('Error creating timestamp triggers:', triggerError);
    }

    console.log('Database setup completed. Some operations may have failed if you don\'t have the necessary permissions.');
    console.log('Please check your Supabase dashboard to verify the tables were created correctly.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
  }
}

// Run the setup
setupDatabase();
