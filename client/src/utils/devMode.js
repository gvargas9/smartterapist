/**
 * Development Mode Utilities
 * 
 * DEPRECATED: This file is being phased out as we move all data to Supabase.
 * Please use the supabaseData.js utilities instead.
 * 
 * @deprecated Use supabaseData.js instead
 */

// Set this to false to disable development mode and use Supabase data
export const DEV_MODE = false;

// Mock user data for different roles
export const MOCK_USERS = {
  client: {
    id: 'client-1',
    email: 'client@example.com',
    role: 'client',
    name: 'Client User',
    profile_data: {
      name: 'Client User',
      avatar_url: null,
      preferences: {
        theme: 'light',
        notifications: true
      }
    },
    created_at: '2025-04-01T10:00:00Z'
  },
  therapist: {
    id: 'therapist-1',
    email: 'therapist@example.com',
    role: 'therapist',
    name: 'Therapist User',
    profile_data: {
      name: 'Therapist User',
      avatar_url: null,
      specialties: ['anxiety', 'depression', 'stress'],
      credentials: 'Ph.D. Psychology',
      years_experience: 8
    },
    created_at: '2025-04-01T10:00:00Z'
  },
  admin: {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
    profile_data: {
      name: 'Admin User',
      avatar_url: null,
      permissions: ['manage_users', 'manage_content', 'view_analytics']
    },
    created_at: '2025-04-01T10:00:00Z'
  }
};

/**
 * Get a mock user based on role
 * @deprecated Use supabaseData.getUser() instead
 */
export const getMockUser = (role = 'therapist') => {
  console.warn('getMockUser is deprecated. Use supabaseData.getUser() instead');
  return MOCK_USERS[role] || MOCK_USERS.therapist;
};

/**
 * Initialize development mode
 * @deprecated Use supabaseData.initApp() instead
 */
export const initDevMode = () => {
  if (DEV_MODE) {
    console.warn('Development mode is being deprecated. Please use supabaseData.initApp() instead');
    console.log('🔧 Development mode enabled - Authentication bypassed');
    
    // Store the default mock user in localStorage if not already present
    if (!localStorage.getItem('smarttherapist_mock_user')) {
      localStorage.setItem('smarttherapist_mock_user', JSON.stringify(MOCK_USERS.therapist));
      console.log('Created default mock user (therapist)');
    }
  } else {
    console.log('✅ Production mode enabled - Using Supabase data');
  }
};

// Mock data for the application
export const MOCK_DATA = {
  clients: [
    { 
      id: 'client-1', 
      users: { 
        profile_data: { name: 'Jane Smith' } 
      },
      email: 'jane@example.com', 
      last_session: '2025-05-10', 
      next_session: '2025-05-15',
      client_behaviors: [{ id: 'behavior-1' }, { id: 'behavior-2' }]
    },
    { 
      id: 'client-2', 
      users: { 
        profile_data: { name: 'John Doe' } 
      },
      email: 'john@example.com', 
      last_session: '2025-05-12', 
      next_session: '2025-05-17',
      client_behaviors: [{ id: 'behavior-3' }]
    },
    { 
      id: 'client-3', 
      users: { 
        profile_data: { name: 'Emily Johnson' } 
      },
      email: 'emily@example.com', 
      last_session: '2025-05-11', 
      next_session: '2025-05-16',
      client_behaviors: [{ id: 'behavior-4' }, { id: 'behavior-5' }]
    }
  ],
  sessions: [
    { id: 'session-1', client_id: 'client-1', start_time: '2025-05-15T10:00:00', end_time: '2025-05-15T11:00:00', clients: { name: 'Jane Smith' } },
    { id: 'session-2', client_id: 'client-2', start_time: '2025-05-17T14:00:00', end_time: '2025-05-17T15:00:00', clients: { name: 'John Doe' } },
    { id: 'session-3', client_id: 'client-3', start_time: '2025-05-16T11:00:00', end_time: '2025-05-16T12:00:00', clients: { name: 'Emily Johnson' } }
  ],
  summaries: [
    { 
      id: 'summary-1', 
      conversation_id: 'conv-1', 
      summary_text: 'Jane expressed anxiety about her new job, particularly about meeting expectations. We explored these thoughts using CBT techniques and identified several cognitive distortions.',
      created_at: '2025-05-10T15:30:00',
      sentiment_metrics: { average: 0.65, trend: 'improving' },
      conversations: { client_id: 'client-1', clients: { name: 'Jane Smith' } }
    },
    { 
      id: 'summary-2', 
      conversation_id: 'conv-2', 
      summary_text: 'John discussed his relationship challenges and feelings of inadequacy. We worked on communication strategies and self-compassion exercises.',
      created_at: '2025-05-12T16:45:00',
      sentiment_metrics: { average: 0.48, trend: 'stable' },
      conversations: { client_id: 'client-2', clients: { name: 'John Doe' } }
    },
    { 
      id: 'summary-3', 
      conversation_id: 'conv-3', 
      summary_text: 'Emily reported progress with her stress management techniques. She has been consistently practicing mindfulness and has noticed improvements in her sleep quality.',
      created_at: '2025-05-11T14:15:00',
      sentiment_metrics: { average: 0.72, trend: 'improving' },
      conversations: { client_id: 'client-3', clients: { name: 'Emily Johnson' } }
    }
  ],
  behaviors: [
    {
      id: 'behavior-1',
      name: 'Anxiety Management',
      description: 'Techniques for managing anxiety and panic attacks',
      created_at: '2025-05-02T13:30:00Z'
    },
    {
      id: 'behavior-2',
      name: 'Depression Support',
      description: 'Support strategies for depression and low mood',
      created_at: '2025-05-04T10:15:00Z'
    },
    {
      id: 'behavior-3',
      name: 'Stress Reduction',
      description: 'Methods to reduce and manage daily stress',
      created_at: '2025-05-06T15:45:00Z'
    },
    {
      id: 'behavior-4',
      name: 'Sleep Improvement',
      description: 'Techniques for better sleep quality and habits',
      created_at: '2025-05-08T09:30:00Z'
    },
    {
      id: 'behavior-5',
      name: 'Mindfulness Practice',
      description: 'Mindfulness and meditation exercises',
      created_at: '2025-05-10T14:00:00Z'
    }
  ],
  stats: {
    users: {
      total: 42,
      clients: 30,
      therapists: 10,
      admins: 2
    },
    behaviors: 15,
    conversations: 128,
    messages: 2456
  }
};
