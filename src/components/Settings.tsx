import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { listClients } from '../services/clientService'
import { listRepairs } from '../services/repairService'
import { listUsers } from '../services/userService'
import { supabase } from '../lib/supabase'
import { listBrands, createBrand, deleteBrand, listModels } from '../services/brandService'
import { listDeviceTypes, createDeviceType, deleteDeviceType } from '../services/deviceTypeService'

const MIGRATION_SUPABASE_URL = 'https://tyxdhlfryibaunzlvtyn.supabase.co'
const MIGRATION_SUPABASE_KEY = 'sb_publishable_RciisT_w4-_Y23wsiW0z1w_Z7ziFEV1'
const MIGRATION_SHEETS = {
  brands: 'Marcas',
  deviceTypes: 'TiposEquipo',
  models: 'Modelos',
  clients: 'Clientes',
  users: 'Usuarios',
  repairs: 'Reparaciones',
  instructions: 'Instrucciones',
} as const

const MIGRATION_CLIENT = createClient(MIGRATION_SUPABASE_URL, MIGRATION_SUPABASE_KEY)

const BRAND_COLUMNS = ['id', 'name', 'created_at']
const DEVICE_TYPE_COLUMNS = ['id', 'name', 'created_at']
const MODEL_COLUMNS = ['id', 'name', 'brand_id', 'created_at']
const CLIENT_COLUMNS = ['id', 'first_name', 'middle_name', 'last_name', 'document', 'email', 'contact', 'address', 'created_at']
const USER_COLUMNS = ['id', 'auth_uid', 'email', 'first_name', 'last_name', 'role', 'local_password', 'created_at']
const REPAIR_COLUMNS = [
  'id',
  'nro',
  'client_id',
  'client_name',
  'client_rut',
  'correo',
  'telefono',
  'tipo_dcto',
  'estado_pago',
  'estado_reparacion',
  'tipo_pago',
  'tipo_equipo',
  'marca',
  'modelo',
  'serie',
  'accesorios',
  'falla',
  'diagnostico',
  'observacion',
  'servicios',
  'repuestos',
  'created_at',
]

function ensureArray(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function serializeJson(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value == null || value === '') return '[]'
  return JSON.stringify(value)
}

function pickColumns(rows: Record<string, any>[], columns: string[], transform?: Record<string, (value: any, row: Record<string, any>) => any>) {
  return rows.map(row => {
    const next: Record<string, any> = {}
    columns.forEach(column => {
      const value = row?.[column]
      next[column] = transform?.[column] ? transform[column](value, row) : (value ?? null)
    })
    return next
  })
}

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [brandName, setBrandName] = useState('')
  const [deviceTypes, setDeviceTypes] = useState<any[]>([])
  const [deviceTypeName, setDeviceTypeName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // removed local password controls per request; this area now focuses on migration backup/restore

  async function downloadBackup() {
    setLoading(true)
    setMessage(null)
    try {
      const [clients, repairs, users, brandsData, models, deviceTypesData] = await Promise.all([
        listClients(),
        listRepairs(),
        listUsers(),
        listBrands(),
        listModels(),
        listDeviceTypes(),
      ])

      // lazy-load SheetJS only when user requests the export
      const XLSXmod = await import('xlsx')
      const XLSX = (XLSXmod && (XLSXmod.default || XLSXmod)) as any

      const brandsWS = XLSX.utils.json_to_sheet(pickColumns(brandsData as any[], BRAND_COLUMNS))
      const deviceTypesWS = XLSX.utils.json_to_sheet(pickColumns(deviceTypesData as any[], DEVICE_TYPE_COLUMNS))
      const modelsWS = XLSX.utils.json_to_sheet(pickColumns(models as any[], MODEL_COLUMNS))
      const clientsWS = XLSX.utils.json_to_sheet(pickColumns(clients as any[], CLIENT_COLUMNS))
      const usersWS = XLSX.utils.json_to_sheet(pickColumns(users as any[], USER_COLUMNS))
      const repairsWS = XLSX.utils.json_to_sheet(
        pickColumns(repairs as any[], REPAIR_COLUMNS, {
          servicios: value => serializeJson(value),
          repuestos: value => serializeJson(value),
        })
      )

      const instructionsWS = XLSX.utils.json_to_sheet([
        { paso: 1, accion: 'Aplica primero el SQL en el proyecto destino', detalle: 'Ejecuta supabase/init.sql antes de importar el Excel.' },
        { paso: 2, accion: 'Carga este Excel en el panel de importación', detalle: 'Las hojas conservan IDs y relaciones para migrar el contenido sin perder vínculos.' },
        { paso: 3, accion: 'Verifica políticas RLS', detalle: 'El proyecto destino debe permitir inserts/updates con la key publicada o una política equivalente.' },
      ])

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, instructionsWS, MIGRATION_SHEETS.instructions)
      XLSX.utils.book_append_sheet(wb, brandsWS, MIGRATION_SHEETS.brands)
      XLSX.utils.book_append_sheet(wb, deviceTypesWS, MIGRATION_SHEETS.deviceTypes)
      XLSX.utils.book_append_sheet(wb, modelsWS, MIGRATION_SHEETS.models)
      XLSX.utils.book_append_sheet(wb, clientsWS, MIGRATION_SHEETS.clients)
      XLSX.utils.book_append_sheet(wb, usersWS, MIGRATION_SHEETS.users)
      XLSX.utils.book_append_sheet(wb, repairsWS, MIGRATION_SHEETS.repairs)

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `valpotec-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMessage('Backup creado y descargado correctamente')
    } catch (e: any) {
      console.error(e)
      setMessage('Error creando backup: ' + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  async function importBackup(file: File) {
    setImporting(true)
    setMessage(null)
    try {
      const XLSXmod = await import('xlsx')
      const XLSX = (XLSXmod && (XLSXmod.default || XLSXmod)) as any
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      const readSheet = (name: string) => {
        const sheet = workbook.Sheets[name]
        if (!sheet) return []
        return XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, any>[]
      }

      const brandsRows = readSheet(MIGRATION_SHEETS.brands)
      const deviceTypesRows = readSheet(MIGRATION_SHEETS.deviceTypes)
      const modelsRows = readSheet(MIGRATION_SHEETS.models)
      const clientsRows = readSheet(MIGRATION_SHEETS.clients)
      const usersRows = readSheet(MIGRATION_SHEETS.users)
      const repairsRows = readSheet(MIGRATION_SHEETS.repairs)

      const brandsPayload = pickColumns(brandsRows, BRAND_COLUMNS)
      const deviceTypesPayload = pickColumns(deviceTypesRows, DEVICE_TYPE_COLUMNS)
      const modelsPayload = pickColumns(modelsRows, MODEL_COLUMNS)
      const clientsPayload = pickColumns(clientsRows, CLIENT_COLUMNS)
      const usersPayload = pickColumns(usersRows, USER_COLUMNS)
      const repairsPayload = pickColumns(repairsRows, REPAIR_COLUMNS, {
        servicios: value => ensureArray(value),
        repuestos: value => ensureArray(value),
      })

      const upsertOptions = { onConflict: 'id' }

      if (brandsPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('brands').upsert(brandsPayload, upsertOptions)
        if (error) throw error
      }
      if (deviceTypesPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('device_types').upsert(deviceTypesPayload, upsertOptions)
        if (error) throw error
      }
      if (modelsPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('models').upsert(modelsPayload, upsertOptions)
        if (error) throw error
      }
      if (clientsPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('clients').upsert(clientsPayload, upsertOptions)
        if (error) throw error
      }
      if (usersPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('users').upsert(usersPayload, upsertOptions)
        if (error) throw error
      }
      if (repairsPayload.length) {
        const { error } = await MIGRATION_CLIENT.from('repairs').upsert(repairsPayload, upsertOptions)
        if (error) throw error
      }

      setMessage(`Importación completada: ${brandsPayload.length} marcas, ${deviceTypesPayload.length} tipos, ${modelsPayload.length} modelos, ${clientsPayload.length} clientes, ${usersPayload.length} usuarios y ${repairsPayload.length} reparaciones.`)
    } catch (e: any) {
      console.error(e)
      setMessage('Error importando backup: ' + (e?.message || String(e)))
    } finally {
      setImporting(false)
    }
  }

  async function onImportSelectedFile() {
    if (!selectedFile) {
      setMessage('Selecciona primero el archivo Excel exportado')
      return
    }
    await importBackup(selectedFile)
  }

  async function loadBrandsAndModels() {
    try {
      const b = await listBrands()
      setBrands(b)
      try { const d = await listDeviceTypes(); setDeviceTypes(d) } catch (_) { setDeviceTypes([]) }
    } catch (e: any) {
      console.error('loadBrandsAndModels', e)
    }
  }

  useEffect(() => {
    loadBrandsAndModels()
    // subscribe to brand/model changes
    const brandSub = supabase.channel('public:brands').on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => loadBrandsAndModels()).subscribe()
    const modelSub = supabase.channel('public:models').on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => loadBrandsAndModels()).subscribe()
    return () => {
      try { brandSub.unsubscribe() } catch (_) {}
      try { modelSub.unsubscribe() } catch (_) {}
    }
  }, [])

  async function onAddBrand() {
    if (!brandName.trim()) return
    try {
      await createBrand(brandName.trim())
      setBrandName('')
      loadBrandsAndModels()
    } catch (e: any) {
      console.error(e)
      setMessage('Error creando marca: ' + (e?.message || String(e)))
    }
  }

  async function onDeleteBrand(id: string) {
    if (!confirm('Eliminar marca? Los modelos vinculados quedarán sin marca.')) return
    try {
      await deleteBrand(id)
      loadBrandsAndModels()
    } catch (e: any) {
      console.error(e)
      setMessage('Error eliminando marca: ' + (e?.message || String(e)))
    }
  }

  async function onAddDeviceType() {
    if (!deviceTypeName.trim()) return
    try {
      await createDeviceType(deviceTypeName.trim())
      setDeviceTypeName('')
      loadBrandsAndModels()
    } catch (e: any) {
      console.error(e)
      setMessage('Error creando tipo de equipo: ' + (e?.message || String(e)))
    }
  }

  async function onDeleteDeviceType(id: string) {
    if (!confirm('Eliminar tipo de equipo?')) return
    try {
      await deleteDeviceType(id)
      loadBrandsAndModels()
    } catch (e: any) {
      console.error(e)
      setMessage('Error eliminando tipo de equipo: ' + (e?.message || String(e)))
    }
  }

  

  return (
    <div style={{ padding: 8 }}>
      <h3>Configuración</h3>
      <p>Exporta tu base actual a Excel y luego carga ese mismo archivo en el proyecto destino para migrar la información conservando IDs y relaciones.</p>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div style={{ padding: 16, border: '1px solid #e9e9e9', borderRadius: 12, background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Zona 1: exportar</h4>
          <p style={{ margin: '0 0 12px 0', color: '#666' }}>Genera un .xlsx con marcas, tipos de equipo, modelos, clientes, usuarios y reparaciones.</p>
          <button className="btn primary" onClick={downloadBackup} disabled={loading}>{loading ? 'Generando...' : 'Descargar Excel completo'}</button>
        </div>

        <div style={{ padding: 16, border: '1px solid #e9e9e9', borderRadius: 12, background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Zona 2: importar al proyecto destino</h4>
          <p style={{ margin: '0 0 12px 0', color: '#666' }}>Destino configurado: {MIGRATION_SUPABASE_URL}</p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            style={{ display: 'block', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={onImportSelectedFile} disabled={importing || !selectedFile}>{importing ? 'Importando...' : 'Subir Excel al destino'}</button>
            <button className="btn" onClick={() => setSelectedFile(null)} disabled={importing || !selectedFile}>Limpiar archivo</button>
          </div>
        </div>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}

      {/* Brand & Model management */}
      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Marcas</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Nueva marca" value={brandName} onChange={e => setBrandName(e.target.value)} />
            <button className="btn" onClick={onAddBrand}>Agregar</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {brands.length === 0 && <div style={{ color: '#666' }}>No hay marcas aún</div>}
            {brands.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
                <div>{b.name}</div>
                <div><button className="btn danger small" onClick={() => onDeleteBrand(b.id)}>Eliminar</button></div>
              </div>
            ))}
          </div>
        </div>

          <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Tipo Equipo</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="Nuevo tipo (ej. Notebook)" value={deviceTypeName} onChange={e => setDeviceTypeName(e.target.value)} />
              <button className="btn" onClick={onAddDeviceType}>Agregar</button>
            </div>
            <div style={{ marginTop: 8 }}>
              {deviceTypes.length === 0 && <div style={{ color: '#666' }}>No hay tipos aún</div>}
              {deviceTypes.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
                  <div>{d.name}</div>
                  <div><button className="btn danger small" onClick={() => onDeleteDeviceType(d.id)}>Eliminar</button></div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  )
}
