-- Create a table for user resumes with proper RLS (Row Level Security)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  skills JSONB,
  experience JSONB,
  education JSONB,
  raw_data JSONB, -- Store the complete parsed resume data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a table for interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  job_title TEXT,
  company_name TEXT,
  job_description TEXT,
  conversation JSONB, -- Store the interview conversation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
-- Enable RLS on tables
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for resumes table
CREATE POLICY "Users can view their own resumes" 
  ON resumes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" 
  ON resumes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for interview_sessions table
CREATE POLICY "Users can view their own interview sessions" 
  ON interview_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions" 
  ON interview_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" 
  ON interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview sessions" 
  ON interview_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX resumes_user_id_idx ON resumes(user_id);
CREATE INDEX interview_sessions_user_id_idx ON interview_sessions(user_id);
CREATE INDEX interview_sessions_resume_id_idx ON interview_sessions(resume_id);

-- Set up functions for updating the updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers for updating the updated_at timestamps
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON resumes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_interview_sessions_updated_at
BEFORE UPDATE ON interview_sessions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 