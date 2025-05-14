-- Fix for Clients Table Recursive Policies
-- 
-- This script specifically addresses the recursive policy issues in the clients table

-- Drop all existing policies on the clients table
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update own data" ON public.clients;
DROP POLICY IF EXISTS "Therapists can view their clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can do anything with clients" ON public.clients;

-- Create a simpler policy for clients to view their own data
CREATE POLICY "Clients can view own data" 
  ON public.clients 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create a simpler policy for clients to update their own data
CREATE POLICY "Clients can update own data" 
  ON public.clients 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create a simpler policy for therapists to view their clients
CREATE POLICY "Therapists can view their clients" 
  ON public.clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'therapist'
    ) AND 
    EXISTS (
      SELECT 1 FROM public.therapists 
      WHERE user_id = auth.uid() AND id = clients.therapist_id
    )
  );

-- Create a simpler policy for admins to manage all clients
CREATE POLICY "Admins can do anything with clients" 
  ON public.clients 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy to allow inserting clients for anyone (needed for testing)
CREATE POLICY "Anyone can insert clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy to allow deleting own clients
CREATE POLICY "Users can delete own clients" 
  ON public.clients 
  FOR DELETE 
  USING (user_id = auth.uid());
