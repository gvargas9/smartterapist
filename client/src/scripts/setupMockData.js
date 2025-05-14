// Setup Mock Data for Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for users
const mockUsers = [
  {
    id: 'client-1',
    email: 'client@example.com',
    role: 'client',
    created_at: new Date().toISOString(),
    name: 'Jane Smith',
    profile_data: {
      name: 'Jane Smith',
      age: 32,
      preferences: {
        theme: 'CBT-focused'
      }
    }
  },
  {
    id: 'therapist-1',
    email: 'therapist@example.com',
    role: 'therapist',
    created_at: new Date().toISOString(),
    name: 'Dr. Lee Wong',
    profile_data: {
      name: 'Dr. Lee Wong',
      title: 'Clinical Psychologist',
      specialties: ['CBT', 'Anxiety', 'Depression']
    }
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
    created_at: new Date().toISOString(),
    name: 'Admin User',
    profile_data: {
      name: 'Admin User'
    }
  }
];

// Mock data for clients
const mockClients = [
  {
    user_id: 'client-1',
    subscription_id: 'sub_123456',
    profile_data: {
      name: 'Jane Smith',
      age: 32,
      concerns: ['Anxiety', 'Work stress'],
      goals: ['Improve coping skills', 'Better work-life balance']
    }
  }
];

// Mock data for therapists
const mockTherapists = [
  {
    user_id: 'therapist-1',
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
];

// Mock data for behavior presets
const mockBehaviors = [
  {
    id: 'behavior-1',
    name: 'CBT-focused',
    prompt_template: 'You are a CBT-focused therapist. Focus on identifying and challenging negative thought patterns.',
    created_by: 'admin-1'
  },
  {
    id: 'behavior-2',
    name: 'Mindfulness',
    prompt_template: 'You are a mindfulness-focused therapist. Emphasize present-moment awareness and acceptance.',
    created_by: 'admin-1'
  },
  {
    id: 'behavior-3',
    name: 'Motivational',
    prompt_template: 'You are a motivational coach. Focus on setting goals and building motivation for change.',
    created_by: 'admin-1'
  }
];

// Mock data for client-behavior associations
const mockClientBehaviors = [
  {
    client_id: 'client-1',
    behavior_id: 'behavior-1',
    active: true
  },
  {
    client_id: 'client-1',
    behavior_id: 'behavior-2',
    active: false
  }
];

// Mock data for conversations
const mockConversations = [
  {
    id: 'conv-1',
    client_id: 'client-1',
    therapist_id: 'therapist-1',
    start_ts: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    end_ts: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600 * 1000).toISOString() // 1 hour after start
  },
  {
    id: 'conv-2',
    client_id: 'client-1',
    therapist_id: null, // AI only
    start_ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    end_ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1800 * 1000).toISOString() // 30 minutes after start
  },
  {
    id: 'conv-3',
    client_id: 'client-1',
    therapist_id: null, // AI only
    start_ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    end_ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2400 * 1000).toISOString() // 40 minutes after start
  }
];

// Mock data for messages
const mockMessages = [
  // Conversation 1
  {
    id: 'msg-1-1',
    conversation_id: 'conv-1',
    sender: 'user',
    text: 'Hi Dr. Lee, I\'ve been feeling anxious about my new job.',
    audio_url: null,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment_score: 0.3
  },
  {
    id: 'msg-1-2',
    conversation_id: 'conv-1',
    sender: 'therapist',
    text: 'I understand, Jane. Starting a new job can be stressful. Can you tell me more about what aspects are causing anxiety?',
    audio_url: null,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 1000).toISOString(),
    sentiment_score: 0.6
  },
  {
    id: 'msg-1-3',
    conversation_id: 'conv-1',
    sender: 'user',
    text: 'I\'m worried I won\'t be able to meet expectations. Everyone seems so experienced.',
    audio_url: null,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
    sentiment_score: 0.2
  },
  {
    id: 'msg-1-4',
    conversation_id: 'conv-1',
    sender: 'therapist',
    text: 'That\'s a common feeling. Let\'s identify these thoughts and see if they\'re realistic. What evidence do you have that you won\'t meet expectations?',
    audio_url: null,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 180 * 1000).toISOString(),
    sentiment_score: 0.7
  },
  
  // Conversation 2 (with AI)
  {
    id: 'msg-2-1',
    conversation_id: 'conv-2',
    sender: 'user',
    text: 'I had a difficult meeting today and I\'m feeling overwhelmed.',
    audio_url: null,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment_score: 0.3
  },
  {
    id: 'msg-2-2',
    conversation_id: 'conv-2',
    sender: 'ai',
    text: 'I'm sorry to hear that, Jane. Difficult meetings can be stressful. Would you like to talk about what happened in the meeting that made it challenging for you?',
    audio_url: null,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
    sentiment_score: 0.6
  },
  {
    id: 'msg-2-3',
    conversation_id: 'conv-2',
    sender: 'user',
    text: 'My ideas were criticized by my manager in front of everyone.',
    audio_url: null,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 1000).toISOString(),
    sentiment_score: 0.1
  },
  {
    id: 'msg-2-4',
    conversation_id: 'conv-2',
    sender: 'ai',
    text: 'That sounds really difficult. Public criticism can feel very exposing and uncomfortable. How did you respond in the moment?',
    audio_url: null,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
    sentiment_score: 0.5
  },
  
  // Conversation 3 (with AI)
  {
    id: 'msg-3-1',
    conversation_id: 'conv-3',
    sender: 'user',
    text: 'I tried the breathing exercise you suggested and it helped with my anxiety.',
    audio_url: null,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment_score: 0.7
  },
  {
    id: 'msg-3-2',
    conversation_id: 'conv-3',
    sender: 'ai',
    text: 'That\'s wonderful to hear, Jane! I\'m glad the breathing exercise was helpful. How often were you able to practice it?',
    audio_url: null,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
    sentiment_score: 0.8
  },
  {
    id: 'msg-3-3',
    conversation_id: 'conv-3',
    sender: 'user',
    text: 'I did it twice yesterday when I felt stressed, and once this morning.',
    audio_url: null,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 90 * 1000).toISOString(),
    sentiment_score: 0.6
  },
  {
    id: 'msg-3-4',
    conversation_id: 'conv-3',
    sender: 'ai',
    text: 'That\'s excellent consistency! How do you feel it\'s affecting your overall stress levels?',
    audio_url: null,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
    sentiment_score: 0.8
  }
];

// Mock data for summaries
const mockSummaries = [
  {
    id: 'summary-1',
    conversation_id: 'conv-1',
    summary_text: 'Jane expressed anxiety about her new job, particularly about meeting expectations. We explored these thoughts using CBT techniques and identified several cognitive distortions. Jane agreed to practice reframing these thoughts before our next session.',
    sentiment_metrics: {
      average: 0.45,
      min: 0.2,
      max: 0.7,
      trend: 'improving'
    }
  },
  {
    id: 'summary-2',
    conversation_id: 'conv-2',
    summary_text: 'Jane discussed a difficult work meeting where her ideas were criticized publicly. She expressed feelings of embarrassment and self-doubt. We explored ways to handle criticism constructively and discussed assertive communication techniques for future meetings.',
    sentiment_metrics: {
      average: 0.38,
      min: 0.1,
      max: 0.6,
      trend: 'stable'
    }
  },
  {
    id: 'summary-3',
    conversation_id: 'conv-3',
    summary_text: 'Jane reported positive results from practicing breathing exercises for anxiety management. She used the technique multiple times when feeling stressed and noticed improvement. We discussed incorporating this into a daily routine and adding additional mindfulness practices.',
    sentiment_metrics: {
      average: 0.73,
      min: 0.6,
      max: 0.8,
      trend: 'improving'
    }
  }
];

// Mock data for upcoming sessions
const mockSessions = [
  {
    id: 'session-1',
    client_id: 'client-1',
    therapist_id: 'therapist-1',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600 * 1000).toISOString(), // 1 hour after start
    status: 'scheduled',
    meeting_url: 'https://meet.example.com/session-1'
  }
];

// Function to insert mock data
async function insertMockData() {
  try {
    console.log('Starting mock data insertion...');

    // Create tables if they don't exist
    await createTables();
    
    // Insert users
    console.log('Inserting users...');
    const { error: usersError } = await supabase
      .from('users')
      .upsert(mockUsers, { onConflict: 'id' });
    
    if (usersError) throw usersError;
    
    // Insert clients
    console.log('Inserting clients...');
    const { error: clientsError } = await supabase
      .from('clients')
      .upsert(mockClients, { onConflict: 'user_id' });
    
    if (clientsError) throw clientsError;
    
    // Insert therapists
    console.log('Inserting therapists...');
    const { error: therapistsError } = await supabase
      .from('therapists')
      .upsert(mockTherapists, { onConflict: 'user_id' });
    
    if (therapistsError) throw therapistsError;
    
    // Insert behaviors
    console.log('Inserting behaviors...');
    const { error: behaviorsError } = await supabase
      .from('behaviors')
      .upsert(mockBehaviors, { onConflict: 'id' });
    
    if (behaviorsError) throw behaviorsError;
    
    // Insert client behaviors
    console.log('Inserting client behaviors...');
    const { error: clientBehaviorsError } = await supabase
      .from('client_behaviors')
      .upsert(mockClientBehaviors, { onConflict: ['client_id', 'behavior_id'] });
    
    if (clientBehaviorsError) throw clientBehaviorsError;
    
    // Insert conversations
    console.log('Inserting conversations...');
    const { error: conversationsError } = await supabase
      .from('conversations')
      .upsert(mockConversations, { onConflict: 'id' });
    
    if (conversationsError) throw conversationsError;
    
    // Insert messages
    console.log('Inserting messages...');
    const { error: messagesError } = await supabase
      .from('messages')
      .upsert(mockMessages, { onConflict: 'id' });
    
    if (messagesError) throw messagesError;
    
    // Insert summaries
    console.log('Inserting summaries...');
    const { error: summariesError } = await supabase
      .from('summaries')
      .upsert(mockSummaries, { onConflict: 'id' });
    
    if (summariesError) throw summariesError;
    
    // Insert sessions
    console.log('Inserting sessions...');
    const { error: sessionsError } = await supabase
      .from('sessions')
      .upsert(mockSessions, { onConflict: 'id' });
    
    if (sessionsError) throw sessionsError;
    
    console.log('Mock data insertion completed successfully!');
  } catch (error) {
    console.error('Error inserting mock data:', error);
  }
}

// Function to create tables if they don't exist
async function createTables() {
  try {
    console.log('Creating tables if they don\'t exist...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'users',
      table_definition: `
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name TEXT,
        profile_data JSONB
      `
    });
    
    if (usersError) throw usersError;
    
    // Create clients table
    const { error: clientsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'clients',
      table_definition: `
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        subscription_id TEXT,
        profile_data JSONB
      `
    });
    
    if (clientsError) throw clientsError;
    
    // Create therapists table
    const { error: therapistsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'therapists',
      table_definition: `
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        credentials JSONB,
        availability JSONB
      `
    });
    
    if (therapistsError) throw therapistsError;
    
    // Create behaviors table
    const { error: behaviorsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'behaviors',
      table_definition: `
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        created_by TEXT REFERENCES users(id)
      `
    });
    
    if (behaviorsError) throw behaviorsError;
    
    // Create client_behaviors table
    const { error: clientBehaviorsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'client_behaviors',
      table_definition: `
        client_id TEXT REFERENCES users(id),
        behavior_id TEXT REFERENCES behaviors(id),
        active BOOLEAN DEFAULT true,
        PRIMARY KEY (client_id, behavior_id)
      `
    });
    
    if (clientBehaviorsError) throw clientBehaviorsError;
    
    // Create conversations table
    const { error: conversationsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'conversations',
      table_definition: `
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id),
        therapist_id TEXT REFERENCES users(id),
        start_ts TIMESTAMP WITH TIME ZONE,
        end_ts TIMESTAMP WITH TIME ZONE
      `
    });
    
    if (conversationsError) throw conversationsError;
    
    // Create messages table
    const { error: messagesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'messages',
      table_definition: `
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id),
        sender TEXT NOT NULL,
        text TEXT,
        audio_url TEXT,
        timestamp TIMESTAMP WITH TIME ZONE,
        sentiment_score FLOAT
      `
    });
    
    if (messagesError) throw messagesError;
    
    // Create summaries table
    const { error: summariesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'summaries',
      table_definition: `
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id),
        summary_text TEXT,
        sentiment_metrics JSONB
      `
    });
    
    if (summariesError) throw summariesError;
    
    // Create sessions table
    const { error: sessionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'sessions',
      table_definition: `
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id),
        therapist_id TEXT REFERENCES users(id),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        status TEXT,
        meeting_url TEXT
      `
    });
    
    if (sessionsError) throw sessionsError;
    
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Run the script
insertMockData();
