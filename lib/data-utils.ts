import { supabase } from './supabase'

/**
 * Save interview session data
 */
export async function saveInterviewSession(data: any) {
  const { data: result, error } = await supabase
    .from('interview_sessions')
    .insert([data])
    .select()
  
  if (error) throw error
  return result[0]
}

/**
 * Get an interview session by ID
 */
export async function getInterviewSession(id: string) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Get all interview sessions for a user
 */
export async function getUserInterviewSessions(userId: string) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Update an interview session
 */
export async function updateInterviewSession(id: string, updates: any) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

/**
 * Delete an interview session
 */
export async function deleteInterviewSession(id: string) {
  const { error } = await supabase
    .from('interview_sessions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
} 