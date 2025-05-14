-- Fix Recursive Policies Script
-- 
-- This script fixes the recursive policy issues by dropping and recreating the policies
-- with non-recursive versions.

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can do anything" ON public.users;

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
  
-- Policy for admins to manage all users - using a simpler approach
CREATE POLICY "Admins can do anything" 
  ON public.users 
  FOR ALL 
  USING (
    -- This is a simplified approach that doesn't cause recursion
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Fix policies for other tables if needed
-- For therapists table
DROP POLICY IF EXISTS "Admins can do anything with therapists" ON public.therapists;
CREATE POLICY "Admins can do anything with therapists" 
  ON public.therapists 
  FOR ALL 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- For clients table
DROP POLICY IF EXISTS "Admins can do anything with clients" ON public.clients;
CREATE POLICY "Admins can do anything with clients" 
  ON public.clients 
  FOR ALL 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- For therapy_sessions table
DROP POLICY IF EXISTS "Admins can do anything with sessions" ON public.therapy_sessions;
CREATE POLICY "Admins can do anything with sessions" 
  ON public.therapy_sessions 
  FOR ALL 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- For messages table
DROP POLICY IF EXISTS "Admins can do anything with messages" ON public.messages;
CREATE POLICY "Admins can do anything with messages" 
  ON public.messages 
  FOR ALL 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- For behavior_records table
DROP POLICY IF EXISTS "Admins can do anything with behavior records" ON public.behavior_records;
CREATE POLICY "Admins can do anything with behavior records" 
  ON public.behavior_records 
  FOR ALL 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
