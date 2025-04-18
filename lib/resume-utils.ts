import { supabase } from './supabase'

/**
 * Save resume data to Supabase
 */
export async function saveResumeData(resumeData: any, userId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .insert([{
      user_id: userId,
      full_name: resumeData.fullName || resumeData.name,
      email: resumeData.email,
      phone: resumeData.phone,
      skills: resumeData.skills,
      experience: resumeData.experience,
      education: resumeData.education,
      raw_data: resumeData  // Store the complete parsed data
    }])
    .select()
  
  if (error) {
    console.error('Error saving resume:', error)
    throw error
  }
  
  return data[0]
}

/**
 * Get all resumes for the current user
 */
export async function getUserResumes() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching resumes:', error)
    throw error
  }
  
  return data
}

/**
 * Get a resume by ID
 */
export async function getResumeById(resumeId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single()
  
  if (error) {
    console.error('Error fetching resume:', error)
    throw error
  }
  
  return data
}

/**
 * Update a resume
 */
export async function updateResume(resumeId: string, updates: any) {
  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', resumeId)
    .select()
  
  if (error) {
    console.error('Error updating resume:', error)
    throw error
  }
  
  return data[0]
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: string) {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
  
  if (error) {
    console.error('Error deleting resume:', error)
    throw error
  }
  
  return true
} 