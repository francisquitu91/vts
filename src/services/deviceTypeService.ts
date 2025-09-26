import { supabase } from '../lib/supabase'

export async function listDeviceTypes() {
  const { data, error } = await supabase.from('device_types').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createDeviceType(name: string) {
  const { data, error } = await supabase.from('device_types').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function deleteDeviceType(id: string) {
  const { error } = await supabase.from('device_types').delete().eq('id', id)
  if (error) throw error
  return true
}
