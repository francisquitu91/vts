import { supabase } from '../lib/supabase'

export async function listBrands() {
  const { data, error } = await supabase.from('brands').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createBrand(name: string) {
  const { data, error } = await supabase.from('brands').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function listModels() {
  const { data, error } = await supabase.from('models').select('*, brands(name)').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createModel(name: string, brand_id: string | null = null) {
  const { data, error } = await supabase.from('models').insert({ name, brand_id }).select().single()
  if (error) throw error
  return data
}

export async function deleteBrand(id: string) {
  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function deleteModel(id: string) {
  const { error } = await supabase.from('models').delete().eq('id', id)
  if (error) throw error
  return true
}
