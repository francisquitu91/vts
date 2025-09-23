import { supabase } from '../lib/supabase'

export type ServiceItem = { id: string; description: string; value: number }
export type PartItem = { id: string; name: string; price: number }

export type RepairRecord = {
  id?: string
  nro?: string
  client_id?: string | null
  client_name?: string
  client_rut?: string
  correo?: string
  telefono?: string
  tipo_dcto?: string
  estado_pago?: string
  estado_reparacion?: string
  tipo_pago?: string
  tipo_equipo?: string
  marca?: string
  modelo?: string
  serie?: string
  accesorios?: string
  falla?: string
  observacion?: string
  servicios?: any[]
  repuestos?: any[]
  created_at?: string
}

export async function listRepairs() {
  const { data, error } = await supabase.from('repairs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as RepairRecord[]
}

export async function createRepair(r: RepairRecord) {
  const payload = { ...r }
  // ensure JSONB fields are arrays (not undefined)
  if (!payload.servicios) payload.servicios = []
  if (!payload.repuestos) payload.repuestos = []
  // normalize client_id: if empty string -> null
  if (payload.client_id === '') payload.client_id = null
  // if client_id provided, verify it exists in clients table; if not, null it to avoid FK error
  if (payload.client_id) {
    try {
      const { data: clientData, error: clientError } = await supabase.from('clients').select('id').eq('id', payload.client_id).single()
      if (clientError || !clientData) {
        console.debug('[repairService] client_id not found in Supabase, clearing client_id to avoid FK', payload.client_id)
        payload.client_id = null
      }
    } catch (err) {
      console.debug('[repairService] error checking client_id', err)
      payload.client_id = null
    }
  }
  console.debug('[repairService] create payload:', JSON.parse(JSON.stringify(payload)))
  const { data, error, status } = await supabase.from('repairs').insert([{ ...payload }]).select()
  if (error) {
    // throw a richer error for the UI to inspect
    const err: any = new Error(error.message)
    err.status = status
    err.details = error.details
    err.hint = error.hint
    throw err
  }
  return data?.[0] as RepairRecord
}

export async function updateRepair(id: string, r: RepairRecord) {
  const payload = { ...r }
  if (!payload.servicios) payload.servicios = []
  if (!payload.repuestos) payload.repuestos = []
  if (payload.client_id === '') payload.client_id = null
  if (payload.client_id) {
    try {
      const { data: clientData, error: clientError } = await supabase.from('clients').select('id').eq('id', payload.client_id).single()
      if (clientError || !clientData) {
        console.debug('[repairService] client_id not found in Supabase, clearing client_id to avoid FK', payload.client_id)
        payload.client_id = null
      }
    } catch (err) {
      console.debug('[repairService] error checking client_id', err)
      payload.client_id = null
    }
  }
  console.debug('[repairService] update payload:', id, JSON.parse(JSON.stringify(payload)))
  const { data, error, status } = await supabase.from('repairs').update(payload).eq('id', id).select()
  if (error) {
    const err: any = new Error(error.message)
    err.status = status
    err.details = error.details
    err.hint = error.hint
    throw err
  }
  return data?.[0] as RepairRecord
}

export async function deleteRepair(id: string) {
  const { error } = await supabase.from('repairs').delete().eq('id', id)
  if (error) throw error
  return true
}
