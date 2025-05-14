import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize Supabase client with the self-hosted server URL and key from .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://studio.gvargas.com/';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ3MTA4ODAwLCJleHAiOjE5MDQ4NzUyMDB9.Q7npnZSv__YCi4UKdUB34YrKj81gAKBlnRDxh75GfJk';

// Create a strongly typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
