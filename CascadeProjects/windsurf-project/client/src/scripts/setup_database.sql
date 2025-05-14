-- Supabase Database Setup Script
-- 
-- This script creates the necessary tables and relationships for the SmartTherapist application.
-- Run this script in your Supabase SQL editor to initialize your database schema.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, create all tables without RLS policies or circular references
-- Create users table (extends Supabase auth.users)
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

-- Create therapists table
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

-- Create clients table
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

-- Now add RLS policies
-- Enable RLS for users table
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
-- Note: We're using a direct role check to avoid recursion
CREATE POLICY "Admins can do anything" 
  ON public.users 
  FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Enable RLS for therapists table
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
  
-- Policy for admins to manage all therapists
CREATE POLICY "Admins can do anything with therapists" 
  ON public.therapists 
  FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Enable RLS for clients table
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
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Now that clients and therapists tables exist, we can add the cross-reference policy
CREATE POLICY "Clients can view assigned therapist" 
  ON public.therapists 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE user_id = auth.uid() AND therapist_id = id
    )
  );

-- Create sessions table
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

-- Enable RLS for therapy_sessions table
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
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Create messages table
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
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Create behavior_records table
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
  USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

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
