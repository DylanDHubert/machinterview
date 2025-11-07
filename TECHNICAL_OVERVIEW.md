# Mach Interview - Technical Overview

## Project Architecture

Mach Interview is an AI-powered interview preparation platform built with Next.js 15, featuring real-time AI interactions, user authentication, and a freemium business model.

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Database**: PostgreSQL via Supabase
- **AI Integration**: 
  - OpenAI Assistants API (resume analysis)
  - OpenAI Realtime API with WebRTC (interview simulation)
- **State Management**: React Context (Auth Context)
- **Real-time Communication**: WebRTC audio streaming
- **Testing**: Jest with React Testing Library

## Core Systems

### 1. Authentication System

**Implementation**: Supabase Auth with custom user profile management

**Key Components**:
- `contexts/auth-context.tsx` - Centralized auth state management
- `components/auth/auth-modal.tsx` - Sign in/up interface
- `supabase/schema.sql` - Database schema with RLS policies

**Architecture**:
```typescript
interface AuthContextType {
  user: User | null                    // Supabase auth user
  dbUser: DBUser | null               // Custom user profile
  loading: boolean
  signIn/signUp/signOut: () => Promise<void>
  canStartInterview: () => boolean
  completeInterview: () => Promise<void>
  getRemainingInterviews: () => number
}
```

**Production Issues & Solutions**:
- **Issue**: `supabase.auth.getUser()` hangs in production mode
- **Solution**: Added 3-second timeouts with graceful fallbacks
- **Benefit**: App loads reliably regardless of auth service issues

### 2. Interview Limit System

**Business Model**: Freemium with 2 free interviews, then upgrade to Pro

**Implementation**:
```typescript
// Constants
FREE_TIER_INTERVIEW_LIMIT = 2
TOKENS_PER_INTERVIEW = 1000  // For tracking purposes

// Interview tracking
token_count: 0     = 2 interviews remaining
token_count: 1000  = 1 interview remaining  
token_count: 2000  = 0 interviews remaining (upgrade required)
```

**Key Methods**:
- `canStartInterview()` - Checks if user can start new interview
- `completeInterview()` - Increments token_count by 1000 when interview ends
- `getRemainingInterviews()` - Calculates remaining interviews from token_count

**Migration Logic**: Automatically migrates existing users from old token system to new interview-based system

### 3. Real-time Interview System

**Architecture**: WebRTC + OpenAI Realtime API

**Key Components**:
- `hooks/use-webrtc.ts` - WebRTC audio session management
- `components/ai-speech-indicator.tsx` - Visual feedback for AI speaking
- `components/broadcast-button.tsx` - Start/stop interview controls
- `components/pause-button.tsx` - Pause/resume functionality

**Flow**:
1. User uploads resume → OpenAI Assistants API analyzes
2. User enters job description → Stored for context
3. Start interview → WebRTC session begins
4. AI asks questions based on resume + job description
5. Real-time voice conversation with visual indicators
6. End interview → Increment interview usage

### 4. Database Schema

**Users Table**:
```sql
create table public.users (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text check (plan in ('free', 'pro')) default 'free',
  token_count integer default 0,  -- Interview tracking
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**Interview Sessions Table**:
```sql
create table public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  job_title text not null,
  company_name text not null,
  job_description text not null,
  resume_data jsonb,
  transcript jsonb,
  tokens_used integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**Row Level Security (RLS)**:
```sql
-- Users can only access their own data
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);
create policy "Users can insert own profile" on users for insert with check (auth.uid() = id);

-- Automatic profile creation on signup
create function handle_new_user() returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
```

## Key Components

### UI Components

**Layout & Navigation**:
- `app/layout.tsx` - Root layout with header and auth providers
- `components/header.tsx` - Navigation with auth status and interview count
- `components/landing-page.tsx` - Marketing landing page

**Interview Interface**:
- `components/left-section.tsx` - Camera/webcam feed area
- `components/webcam-feed.tsx` - Live video stream
- `components/interview-transcript.tsx` - Real-time conversation display
- `components/setup-modal.tsx` - Resume upload and job description entry

**Business Logic**:
- `components/job-info-sidebar.tsx` - Display job and resume information
- `components/usage/token-usage-display.tsx` - Show remaining interviews (removed from UI)

### Hooks & Utilities

**Core Hooks**:
- `hooks/use-webrtc.ts` - WebRTC audio session management
- `hooks/use-auth.ts` - Authentication state management

**Utilities**:
- `lib/supabase.ts` - Supabase client configuration
- `lib/tools.ts` - AI tools and function definitions
- `lib/conversations.ts` - Interview conversation types
- `lib/reset-utils.ts` - Global state reset functionality

## API Routes

### Backend Endpoints

**File Processing**:
- `app/api/upload-pdf/route.ts` - Resume PDF upload and analysis
- `app/api/check-run/route.ts` - Check OpenAI assistant processing status

**Session Management**:
- `app/api/session/route.ts` - Handle interview session data

## Development vs Production

### Key Differences

**Development Mode** (`npm run dev`):
- Mock data available for quick testing
- More permissive error handling
- Hot reload and faster iteration

**Production Mode** (`npm run build && npm run start`):
- Optimized builds and performance
- Stricter security and error handling
- **Known Issue**: Supabase auth calls can hang
  - **Solution**: Implemented timeouts and fallbacks

### Environment Configuration

**Required Environment Variables**:
```bash
OPENAI_API_KEY="sk-proj-..."
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

**Build Configuration** (`next.config.js`):
```javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
}
```

## Testing Strategy

### Test Coverage

**Integration Tests**:
- `__tests__/integration/interview-token-usage.test.tsx` - Interview limit system
- Comprehensive test coverage for auth flows and interview tracking

**Key Test Scenarios**:
- New user signup → 2 interviews available
- Complete interview → Decrement to 1 interview
- Complete second interview → Show upgrade prompt
- Pro user → Unlimited interviews

## Known Issues & Solutions

### 1. Production Auth Hanging
**Issue**: `supabase.auth.getUser()` hangs indefinitely in production
**Root Cause**: Supabase auth service networking issues
**Solution**: 3-second timeouts with graceful fallbacks

### 2. RLS Policy Issues
**Issue**: Database queries hanging due to missing RLS policies
**Root Cause**: Missing INSERT policy for users table
**Solution**: Added comprehensive RLS policies for all operations

### 3. JWT Token Context
**Issue**: Database queries fail when JWT token not properly passed
**Root Cause**: Session timing and token propagation issues
**Solution**: Removed problematic session checks, rely on RLS policies

## Performance Optimizations

### Bundle Optimization
- Tree-shaking for unused dependencies
- Code splitting for better load times
- Optimized Next.js production builds

### User Experience
- Timeout mechanisms prevent infinite loading
- Graceful fallbacks for auth failures
- Real-time visual feedback during interviews
- Responsive design for all screen sizes

## Security Considerations

### Authentication Security
- Supabase Auth with secure JWT tokens
- Row Level Security (RLS) policies enforce data isolation
- Automatic user profile creation with proper permissions

### Data Protection
- User data isolated by RLS policies
- Secure API key management
- No sensitive data in client-side code

## Deployment

### Build Process
```bash
npm run build      # Creates optimized production build
npm run start      # Starts production server
```

### Database Setup
1. Run SQL schema in Supabase dashboard
2. Ensure RLS policies are active
3. Configure auth triggers for user creation

### Environment Setup
1. Configure Supabase project
2. Set up OpenAI API access
3. Add environment variables to deployment platform

## Future Enhancements

### Potential Improvements
- Advanced interview analytics and scoring
- Multiple interview types (technical, behavioral, etc.)
- Integration with job boards and ATS systems
- Advanced video analysis and feedback
- Team/organization accounts

### Technical Debt
- Reduce debug logging in production
- Implement proper error boundaries
- Add comprehensive monitoring and alerting
- Optimize WebRTC connection handling

---

*Last Updated: January 2025*
*Technical Documentation for Mach Interview v1.0* 