-- AI Coach & Therapist Platform Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'therapist', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  profile_data JSONB
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  profile_data JSONB
);

-- Therapists table
CREATE TABLE IF NOT EXISTS therapists (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credentials JSONB,
  availability JSONB
);

-- Behavior presets table
CREATE TABLE IF NOT EXISTS behaviors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client-behavior associations
CREATE TABLE IF NOT EXISTS client_behaviors (
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  behavior_id UUID REFERENCES behaviors(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  PRIMARY KEY (client_id, behavior_id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_ts TIMESTAMP WITH TIME ZONE,
  CONSTRAINT client_required CHECK (client_id IS NOT NULL)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'therapist', 'system')),
  text TEXT,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sentiment_score FLOAT,
  CONSTRAINT conversation_required CHECK (conversation_id IS NOT NULL)
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  summary_text TEXT,
  sentiment_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT conversation_required CHECK (conversation_id IS NOT NULL)
);

-- Sessions table (for scheduled live sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  meeting_url TEXT,
  notes TEXT,
  CONSTRAINT client_required CHECK (client_id IS NOT NULL),
  CONSTRAINT therapist_required CHECK (therapist_id IS NOT NULL),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Row Level Security Policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users 
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY users_select_therapist ON users 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id = id
    )
  );
  
CREATE POLICY users_select_admin ON users 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Clients table policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_own ON clients 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY clients_select_therapist ON clients 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id = user_id
    )
  );
  
CREATE POLICY clients_select_admin ON clients 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Therapists table policies
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

CREATE POLICY therapists_select_own ON therapists 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY therapists_select_client ON therapists 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM sessions WHERE therapist_id = user_id
    )
  );
  
CREATE POLICY therapists_select_admin ON therapists 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Behaviors table policies
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY behaviors_select_all ON behaviors 
  FOR SELECT USING (true);

-- Client_behaviors table policies
ALTER TABLE client_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_behaviors_select_own ON client_behaviors 
  FOR SELECT USING (auth.uid() = client_id);
  
CREATE POLICY client_behaviors_select_therapist ON client_behaviors 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id = client_id
    )
  );
  
CREATE POLICY client_behaviors_select_admin ON client_behaviors 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Conversations table policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select_own ON conversations 
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = therapist_id);
  
CREATE POLICY conversations_select_therapist ON conversations 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id = client_id
    )
  );
  
CREATE POLICY conversations_select_admin ON conversations 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Messages table policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_conversation_participant ON messages 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT therapist_id FROM conversations WHERE id = conversation_id
    )
  );
  
CREATE POLICY messages_select_therapist ON messages 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id IN (
        SELECT client_id FROM conversations WHERE id = conversation_id
      )
    )
  );
  
CREATE POLICY messages_select_admin ON messages 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Summaries table policies
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY summaries_select_conversation_participant ON summaries 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT therapist_id FROM conversations WHERE id = conversation_id
    )
  );
  
CREATE POLICY summaries_select_therapist ON summaries 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT therapist_id FROM sessions WHERE client_id IN (
        SELECT client_id FROM conversations WHERE id = conversation_id
      )
    )
  );
  
CREATE POLICY summaries_select_admin ON summaries 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Sessions table policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_participant ON sessions 
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = therapist_id);
  
CREATE POLICY sessions_select_admin ON sessions 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Create stored procedure for inserting mock data
CREATE OR REPLACE FUNCTION insert_mock_data()
RETURNS void AS $$
BEGIN
  -- Insert admin user
  INSERT INTO users (id, email, role, name, profile_data)
  VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 'Admin User', '{"name": "Admin User"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert therapist user
  INSERT INTO users (id, email, role, name, profile_data)
  VALUES 
    ('00000000-0000-0000-0000-000000000002', 'therapist@example.com', 'therapist', 'Dr. Lee Wong', 
     '{"name": "Dr. Lee Wong", "title": "Clinical Psychologist", "specialties": ["CBT", "Anxiety", "Depression"]}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert client user
  INSERT INTO users (id, email, role, name, profile_data)
  VALUES 
    ('00000000-0000-0000-0000-000000000003', 'client@example.com', 'client', 'Jane Smith', 
     '{"name": "Jane Smith", "age": 32, "preferences": {"theme": "CBT-focused"}}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert therapist profile
  INSERT INTO therapists (user_id, credentials, availability)
  VALUES 
    ('00000000-0000-0000-0000-000000000002', 
     '{"license": "PSY12345", "education": "Ph.D. Clinical Psychology, Stanford University", "years_experience": 12}'::jsonb,
     '{"monday": ["9:00", "10:00", "11:00", "13:00", "14:00"], 
       "tuesday": ["9:00", "10:00", "11:00", "13:00", "14:00"], 
       "wednesday": ["9:00", "10:00", "11:00", "13:00", "14:00"], 
       "thursday": ["9:00", "10:00", "11:00", "13:00", "14:00"], 
       "friday": ["9:00", "10:00", "11:00", "13:00", "14:00"]}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert client profile
  INSERT INTO clients (user_id, subscription_id, profile_data)
  VALUES 
    ('00000000-0000-0000-0000-000000000003', 'sub_123456', 
     '{"name": "Jane Smith", "age": 32, "concerns": ["Anxiety", "Work stress"], "goals": ["Improve coping skills", "Better work-life balance"]}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert behavior presets
  INSERT INTO behaviors (id, name, prompt_template, created_by)
  VALUES 
    ('00000000-0000-0000-0000-000000000004', 'CBT-focused', 
     'You are a CBT-focused therapist. Focus on identifying and challenging negative thought patterns.', 
     '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000005', 'Mindfulness', 
     'You are a mindfulness-focused therapist. Emphasize present-moment awareness and acceptance.', 
     '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000006', 'Motivational', 
     'You are a motivational coach. Focus on setting goals and building motivation for change.', 
     '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert client-behavior associations
  INSERT INTO client_behaviors (client_id, behavior_id, active)
  VALUES 
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', true),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', false)
  ON CONFLICT (client_id, behavior_id) DO NOTHING;
  
  -- Insert conversations
  INSERT INTO conversations (id, client_id, therapist_id, start_ts, end_ts)
  VALUES 
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour'),
    ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', NULL, 
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'),
    ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', NULL, 
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '40 minutes')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert messages for conversation 1
  INSERT INTO messages (id, conversation_id, sender, text, timestamp, sentiment_score)
  VALUES 
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000007', 'user', 
     'Hi Dr. Lee, I''ve been feeling anxious about my new job.', 
     NOW() - INTERVAL '7 days', 0.3),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', 'therapist', 
     'I understand, Jane. Starting a new job can be stressful. Can you tell me more about what aspects are causing anxiety?', 
     NOW() - INTERVAL '7 days' + INTERVAL '1 minute', 0.6),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000007', 'user', 
     'I''m worried I won''t be able to meet expectations. Everyone seems so experienced.', 
     NOW() - INTERVAL '7 days' + INTERVAL '2 minutes', 0.2),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000007', 'therapist', 
     'That''s a common feeling. Let''s identify these thoughts and see if they''re realistic. What evidence do you have that you won''t meet expectations?', 
     NOW() - INTERVAL '7 days' + INTERVAL '3 minutes', 0.7)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert messages for conversation 2
  INSERT INTO messages (id, conversation_id, sender, text, timestamp, sentiment_score)
  VALUES 
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000008', 'user', 
     'I had a difficult meeting today and I''m feeling overwhelmed.', 
     NOW() - INTERVAL '3 days', 0.3),
    ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000008', 'ai', 
     'I'm sorry to hear that, Jane. Difficult meetings can be stressful. Would you like to talk about what happened in the meeting that made it challenging for you?', 
     NOW() - INTERVAL '3 days' + INTERVAL '30 seconds', 0.6),
    ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000008', 'user', 
     'My ideas were criticized by my manager in front of everyone.', 
     NOW() - INTERVAL '3 days' + INTERVAL '1 minute 30 seconds', 0.1),
    ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000008', 'ai', 
     'That sounds really difficult. Public criticism can feel very exposing and uncomfortable. How did you respond in the moment?', 
     NOW() - INTERVAL '3 days' + INTERVAL '2 minutes', 0.5)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert messages for conversation 3
  INSERT INTO messages (id, conversation_id, sender, text, timestamp, sentiment_score)
  VALUES 
    ('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000009', 'user', 
     'I tried the breathing exercise you suggested and it helped with my anxiety.', 
     NOW() - INTERVAL '1 day', 0.7),
    ('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000009', 'ai', 
     'That''s wonderful to hear, Jane! I''m glad the breathing exercise was helpful. How often were you able to practice it?', 
     NOW() - INTERVAL '1 day' + INTERVAL '30 seconds', 0.8),
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000009', 'user', 
     'I did it twice yesterday when I felt stressed, and once this morning.', 
     NOW() - INTERVAL '1 day' + INTERVAL '1 minute 30 seconds', 0.6),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000009', 'ai', 
     'That''s excellent consistency! How do you feel it''s affecting your overall stress levels?', 
     NOW() - INTERVAL '1 day' + INTERVAL '2 minutes', 0.8)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert summaries
  INSERT INTO summaries (id, conversation_id, summary_text, sentiment_metrics)
  VALUES 
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000007', 
     'Jane expressed anxiety about her new job, particularly about meeting expectations. We explored these thoughts using CBT techniques and identified several cognitive distortions. Jane agreed to practice reframing these thoughts before our next session.', 
     '{"average": 0.45, "min": 0.2, "max": 0.7, "trend": "improving"}'::jsonb),
    ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000008', 
     'Jane discussed a difficult work meeting where her ideas were criticized publicly. She expressed feelings of embarrassment and self-doubt. We explored ways to handle criticism constructively and discussed assertive communication techniques for future meetings.', 
     '{"average": 0.38, "min": 0.1, "max": 0.6, "trend": "stable"}'::jsonb),
    ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000009', 
     'Jane reported positive results from practicing breathing exercises for anxiety management. She used the technique multiple times when feeling stressed and noticed improvement. We discussed incorporating this into a daily routine and adding additional mindfulness practices.', 
     '{"average": 0.73, "min": 0.6, "max": 0.8, "trend": "improving"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert upcoming session
  INSERT INTO sessions (id, client_id, therapist_id, start_time, end_time, status, meeting_url)
  VALUES 
    ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'scheduled', 'https://meet.example.com/session-1')
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Call the function to insert mock data
SELECT insert_mock_data();
