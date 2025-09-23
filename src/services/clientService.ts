import { supabase } from '../lib/supabase'

export type ClientRecord = {
  id?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  document?: string
  email?: string
  contact?: string
  address?: string
  created_at?: string
}

export async function listClients(): Promise<ClientRecord[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as ClientRecord[]
}

export async function createClient(c: ClientRecord) {
  const { data, error } = await supabase.from('clients').insert([{ ...c }]).select()
  if (error) throw error
  return data?.[0] as ClientRecord
}

export async function updateClient(id: string, c: ClientRecord) {
  const { data, error } = await supabase.from('clients').update(c).eq('id', id).select()
  if (error) throw error
  return data?.[0] as ClientRecord
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  return true
}
