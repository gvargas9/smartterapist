# Zaira Montoya AI Wellness Coach

A subscription-based, cross-platform (web & mobile) application where end-users (clients) can chat and speak with a configurable AI coach/therapist agent. Certified therapists have dashboards to review AI summaries, adjust agent behaviors, and run live sessions.

## Key Features

- Client chat & voice interface powered by configurable LLMs & ultravox.ai TTS/STT
- Conversation logging, automated summaries, sentiment analysis
- Therapist dashboard to view history, summaries, and behavior presets
- Admin panel for managing behavior presets and user subscriptions
- Subscription management and authentication with Supabase
- Workflow automation via n8n for tasks (reminders, billing triggers)
- Multi-lingual support throughout the application
- All data stored in Supabase (no hardcoded mock data)

## Technology Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js/Express
- Database: Postgres (via Supabase)
- Authentication: Supabase Auth
- Voice Processing: ultravox.ai TTS/STT
- Workflow Automation: n8n

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account
- ultravox.ai API keys
- n8n setup (for workflows)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables (see `.env.example` files)
4. Start the development servers:
   ```
   # Frontend
   cd client && npm run dev
   
   # Backend
   cd server && npm run dev
   ```

## Project Structure

- `/client` - React frontend application
- `/server` - Node.js/Express backend
- `/docs` - Additional documentation

## Implementation Details

### Supabase Integration

All application data is stored in Supabase with the following structure:
- **Authentication**: Using Supabase Auth for user management
- **Database Tables**:
  - `users`: User profiles and authentication data
  - `clients`: Client-specific information
  - `therapists`: Therapist credentials and availability
  - `behaviors`: Behavior presets for AI agent configuration
  - `client_behaviors`: Mapping of behaviors to clients
  - `sessions`: Scheduled therapy sessions
  - `conversations`: Chat history between clients and AI
  - `summaries`: AI-generated summaries of conversations
  - `translations`: Multi-language support strings

### Multi-Lingual Support

The application supports multiple languages through:
- i18next integration with React components
- Translation strings stored in Supabase
- Language detection and user preference saving
- Language switching UI in the application

### Development Mode

Development mode has been updated to use Supabase data instead of hardcoded mock data. This ensures consistency between development and production environments.

## License

Proprietary - Inspiration AI / Gvargas Inc.
