import { supabase } from '../lib/supabase'

export type UserProfile = {
  id?: string
  auth_uid?: string
  email?: string
  first_name?: string
  last_name?: string
  role?: 'admin' | 'worker' | string
  created_at?: string
}

export async function listUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as UserProfile[]
}

export async function createUser(profile: { email: string; password?: string; local_password?: string; first_name?: string; last_name?: string; role?: string }) {
  // create account via Supabase Auth if password supplied
  let authUid: string | null = null
  if (profile.password) {
    const { data: signData, error: signError } = await supabase.auth.signUp({ email: profile.email, password: profile.password })
    if (signError) throw signError
    authUid = (signData.user as any)?.id || null
  }

  const insertRow: any = { auth_uid: authUid, email: profile.email, first_name: profile.first_name, last_name: profile.last_name, role: profile.role || 'worker' }
  if (profile.local_password) insertRow.local_password = profile.local_password

  const { data, error } = await supabase.from('users').insert([insertRow]).select()
  if (error) throw error
  return data?.[0] as UserProfile
}

export async function updateUser(id: string, profile: Partial<UserProfile>) {
  const { data, error } = await supabase.from('users').update(profile).eq('id', id).select()
  if (error) throw error
  return data?.[0] as UserProfile
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function sendResetEmail(email: string) {
  // This will send a password reset email to the user using Supabase client
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
  return data
}
