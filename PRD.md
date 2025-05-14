Product Requirements Document (PRD)

Project: AI Coach & Therapist Platform
Version: 1.0
Date: May 10, 2025
Author: Inspiration AI / Gvargas Inc.

1. Revision History

Date

Version

Author

Description

2025-05-10

1.0

G. Vargas / AI Assistant

Initial draft PRD

2. Objective

Build a subscription-based, cross-platform (web & mobile) Multi lingual application in Windsurf where end-users (clients) can chat and speak with a configurable AI coach/therapist agent. Certified therapists have dashboards to review AI summaries, adjust agent behaviors, and run live sessions.

Success Metrics:

1,000 paying subscribers in 6 months

Average session satisfaction ≥ 4.5/5

Therapist onboarding rate ≥ 80%

3. Stakeholders

End Users (Clients): Seek coaching/therapy via AI

Therapists/Coaches: Deliver live sessions and configure AI agents

Admin: Manage behavior presets and user subscriptions

DevOps: Deploy and maintain system

Compliance Officer: Ensure HIPAA/GDPR adherence

4. Scope

In Scope:

Client chat & voice interface powered by configurable LLMs & ultravox.ai TTS/STT

Conversation logging, automated summaries, sentiment analysis

Therapist dashboard per client: view history, summaries, behavior presets

Behavior preset management in admin panel

Subscription management, authentication with Supabase

Workflow automation via n8n for tasks (reminders, billing triggers)

Postgres (hosted via Supabase) for data storage

Responsive design for web & mobile

Out of Scope:

Native mobile builds (initially via PWA)

In-depth analytics beyond basic metrics

5. User Personas & Journeys

Persona A: Jane (Client)

Browses to web PWA

Creates account, chooses subscription

Chats or speaks with personalized AI agent adjusted by Therapist.

Has access to personalized meetings with Therapists.

Receives session summaries via email

Persona B: Dr. Lee (Therapist)

Logs into dashboard

Reviews AI-generated summaries and sentiment

Selects from presets (e.g., "CBT-focused", "Mindfulness", "Motivational") to adjust AI behavior for each client. AI agent is adjusted by Therapist and can be personalized for each client. AI agent can have multiple presets activated at the same time.

Conducts live virtual or in-person sessions, referencing AI insights

Persona C: Admin

Manages subscription plans

Creates or edits behavior presets via admin UI

6. Functional Requirements

6.1. Authentication & Authorization

Supabase-auth: email/password, OAuth

Roles: Client, Therapist, Admin

6.2. Client Interface

Chat UI: Text input, message history, transcript scroll

Voice UI: Record/stop buttons, playback

Settings: Choose preferred LLM, voice model

6.3. AI Agent Interaction

LLM Configuration: In user settings, pick from deployed LLM endpoints (e.g., GPT-4, Claude)

TTS/STT: Configure ultravox.ai, elevenlabs or other TTS/STT API key

Behaviors: Agent uses prompts based on selected presets

6.4. Conversation Management

Storage: Save raw transcript (text + audio metadata) in Postgres

Summarization: Daily or per-session summary via n8n trigger

Sentiment Analysis: Tag each message

6.5. Therapist Dashboard

Client List: Search/filter by name, subscription status

Client Detail View: Transcript timeline, AI summary, sentiment chart

Behavior Presets Panel: Activate/deactivate presets for this client

Live Session Launcher: Start Jitsi/Zoom embedded call

Can add notes to client profile.
Can send and receove messates from client and admin.
Can ask questions to AI agent about their client.

6.6. Admin Panel

Preset Management: CRUD for behavior presets (name, description, prompt template)

Subscription Plans: CRUD, pricing tiers

User Management: CRUD, role assignments

6.7. Billing & Subscription

Integrate Stripe via n8n

Webhooks for subscription events

Automated emails for renewals

7. Non-Functional Requirements

Security: HIPAA-compliant hosting, encryption at rest/in transit

Performance: <200ms chat response latency

Scalability: Kubernetes-based deployment supports 10k concurrent sessions

Availability: 99.9% uptime

Accessibility: WCAG 2.1 AA

8. Technical Architecture

Client (React/Windsurf)  <-- HTTPS -->  API Server  <--->  Supabase(Postgres)
                                       |                     |
                                       ---> n8n workflows      ---> ultravox.ai
                                       ---> LLM Proxy Layer (configurable)

Frontend: Windsurf-generated React components, Tailwind CSS

Backend: Node.js/Express or serverless functions

Integration: n8n for event-driven tasks

Database: Supabase-managed Postgres

9. Data Model (Postgres)

Table: users (id, email, role, created_at)
Table: clients (user_id FK, subscription_id, profile_data)
Table: therapists (user_id FK, credentials, availability)
Table: behaviors (id, name, prompt_template, created_by)
Table: client_behaviors (client_id FK, behavior_id FK, active)
Table: conversations (id, client_id FK, therapist_id FK?, start_ts, end_ts)
Table: messages (id, conversation_id FK, sender (AI/user), text, audio_url, timestamp)
Table: summaries (id, conversation_id FK, summary_text, sentiment_metrics)

10. API Endpoints (REST)

Endpoint

Method

Description

POST /auth/signup

POST

Register new user

POST /auth/login

POST

Authenticate

GET /clients/:id/conversations

GET

List all conversations for client

POST /clients/:id/conversations

POST

Start new conversation

GET /conversations/:id/messages

GET

Fetch message history

POST /conversations/:id/messages

POST

Send message (text or audio)

GET /therapists/:id/dashboard

GET

Therapist overview (summaries & clients)

PATCH /clients/:id/behaviors

PATCH

Update active behaviors

GET /admin/behaviors

GET

List all presets

POST /admin/behaviors

POST

Create new behavior preset

...

...

...

11. Third-Party & Configuration

Ultravox.ai: STT/TTS integration; store API key in Vault

LLM Providers: Environment-based endpoints; allow fallback order

Stripe: Billing webhooks via n8n

Jitsi/Zoom: Embedded live call SDK

12. UI Mockups & Templates (Markdown Wireframes)

12.1. Login Screen

[Logo]
Email: [__________]
Password: [__________]
[Login] [Sign up]

12.2. Client Chat

--------------------------------------
| Chat Title        [Settings ⚙️]    |
--------------------------------------
| AI: Hello, how can I help today?   |
| > [Client message input...] [_🎤]  |
| [Send]                              |
--------------------------------------

12.3. Therapist Dashboard

[Search ▢] [Filter: Active ▾]
---------------------------------------------
| Client Name | Last Session | Summary Score |
---------------------------------------------
| Jane Doe    | 05/09/2025   | Positive      |
| ...         | ...          | ...           |
---------------------------------------------
[Select] -> Detail View

12.4. Behavior Preset Editor

Name: [Motivational Boost]  
Prompt Template: [You are an encouraging coach…]
[Save] [Cancel]

13. Testing & QA Strategy

Unit Tests: 80% coverage for backend logic

E2E Tests: Automate chat flows (Cypress)

Security Audits: Quarterly penetration testing

14. Deployment & Maintenance

CI/CD via GitHub Actions → Kubernetes (GKE/EKS)

Infra as Code: Terraform

Monitoring: Prometheus & Grafana

Support: Ticketing via Chatwoot

End of PRD