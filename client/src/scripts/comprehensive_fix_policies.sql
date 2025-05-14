-- Comprehensive Fix for Recursive Policies
-- 
-- This script provides a more thorough approach to fixing recursive policy issues
-- by completely dropping and recreating all RLS policies with non-recursive versions.

-- First, enable RLS on all tables if not already enabled
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.behavior_records ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on ALL tables to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can do anything" ON public.users;
DROP POLICY IF EXISTS "Therapists can view their clients" ON public.users;
DROP POLICY IF EXISTS "Therapists can view own data" ON public.therapists;
DROP POLICY IF EXISTS "Therapists can update own data" ON public.therapists;
DROP POLICY IF EXISTS "Admins can do anything with therapists" ON public.therapists;
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update own data" ON public.clients;
DROP POLICY IF EXISTS "Therapists can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can do anything with clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Therapists can view their sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Admins can do anything with sessions" ON public.therapy_sessions;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can do anything with messages" ON public.messages;
DROP POLICY IF EXISTS "Clients can view own records" ON public.behavior_records;
DROP POLICY IF EXISTS "Therapists can view client records" ON public.behavior_records;
DROP POLICY IF EXISTS "Admins can do anything with behavior records" ON public.behavior_records;

-- Create a temporary function to check if a user is an admin
-- This avoids the recursion issue by using a direct query
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a temporary function to check if a user is a therapist
CREATE OR REPLACE FUNCTION public.is_therapist()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'therapist'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a temporary function to check if a user is a client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies for the users table
-- Policy for users to view their own data
CREATE POLICY "Users can view own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);
  
-- Policy for users to update their own data
CREATE POLICY "Users can update own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);
  
-- Policy for admins to manage all users
CREATE POLICY "Admins can do anything" 
  ON public.users 
  FOR ALL 
  USING (public.is_admin());

-- Policy for therapists to view their clients
CREATE POLICY "Therapists can view their clients" 
  ON public.users 
  FOR SELECT 
  USING (
    public.is_therapist() AND 
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.therapists t ON c.therapist_id = t.id
      WHERE c.user_id = users.id AND t.user_id = auth.uid()
    )
  );

-- Policies for therapists table
CREATE POLICY "Therapists can view own data" 
  ON public.therapists 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Therapists can update own data" 
  ON public.therapists 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can do anything with therapists" 
  ON public.therapists 
  FOR ALL 
  USING (public.is_admin());

-- Policies for clients table
CREATE POLICY "Clients can view own data" 
  ON public.clients 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update own data" 
  ON public.clients 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Therapists can view their clients" 
  ON public.clients 
  FOR SELECT 
  USING (
    public.is_therapist() AND 
    EXISTS (
      SELECT 1 FROM public.therapists 
      WHERE user_id = auth.uid() AND id = clients.therapist_id
    )
  );

CREATE POLICY "Admins can do anything with clients" 
  ON public.clients 
  FOR ALL 
  USING (public.is_admin());

-- Policies for therapy_sessions table
CREATE POLICY "Clients can view own sessions" 
  ON public.therapy_sessions 
  FOR SELECT 
  USING (
    public.is_client() AND 
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE user_id = auth.uid() AND id = therapy_sessions.client_id
    )
  );

CREATE POLICY "Therapists can view their sessions" 
  ON public.therapy_sessions 
  FOR SELECT 
  USING (
    public.is_therapist() AND 
    EXISTS (
      SELECT 1 FROM public.therapists 
      WHERE user_id = auth.uid() AND id = therapy_sessions.therapist_id
    )
  );

CREATE POLICY "Admins can do anything with sessions" 
  ON public.therapy_sessions 
  FOR ALL 
  USING (public.is_admin());

-- Policies for messages table
CREATE POLICY "Users can view their messages" 
  ON public.messages 
  FOR SELECT 
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Admins can do anything with messages" 
  ON public.messages 
  FOR ALL 
  USING (public.is_admin());

-- Policies for behavior_records table
CREATE POLICY "Clients can view own records" 
  ON public.behavior_records 
  FOR SELECT 
  USING (
    public.is_client() AND 
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE user_id = auth.uid() AND id = behavior_records.client_id
    )
  );

CREATE POLICY "Therapists can view client records" 
  ON public.behavior_records 
  FOR SELECT 
  USING (
    public.is_therapist() AND 
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.therapists t ON c.therapist_id = t.id
      WHERE t.user_id = auth.uid() AND c.id = behavior_records.client_id
    )
  );

CREATE POLICY "Admins can do anything with behavior records" 
  ON public.behavior_records 
  FOR ALL 
  USING (public.is_admin());
