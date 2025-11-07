# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and create a new project
3. Wait for the project to be provisioned

## 2. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Under "Site URL", add your development URL: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000/auth/callback`

## 3. Set up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql` and run it
3. This will create:
   - `users` table to extend auth.users
   - `interview_sessions` table to track interviews
   - Row Level Security policies
   - Automatic triggers for user creation

## 4. Environment Variables

Create a `.env.local` file in your project root:

```env
# OpenAI API Key (existing)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get your Supabase URL and Anon Key from:
- Project Settings → API → Project URL
- Project Settings → API → Project API Keys → anon public

## 5. Test the Setup

1. Run your development server: `pnpm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In" in the header
4. Create a new account or sign in
5. Check your Supabase dashboard to see the user record created

## 6. Free Tier Configuration

The current setup provides:
- **Free Tier**: 2 interviews per user
- **Pro Tier**: Unlimited interviews

Users' interview usage is tracked using the `token_count` field in the `users` table:
- `token_count: 0` = 2 interviews remaining
- `token_count: 1000` = 1 interview remaining  
- `token_count: 2000` = 0 interviews remaining (limit reached)

You can adjust these limits in `contexts/auth-context.tsx` by modifying the `FREE_TIER_INTERVIEW_LIMIT` constant.

## 7. Interview Tracking

Interview usage is automatically tracked when users complete interviews:
- Each interview session creates a record in `interview_sessions`
- When an interview ends, the system calls `completeInterview()` which increments `token_count` by 1000
- Users are blocked from starting interviews when they reach their 2-interview limit
- Pro users have unlimited interviews and bypass all limits 