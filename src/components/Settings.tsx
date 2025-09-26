import React, { useEffect, useState } from 'react'
import { listClients } from '../services/clientService'
import { listRepairs } from '../services/repairService'
import { listUsers } from '../services/userService'
import { supabase } from '../lib/supabase'
import { listBrands, createBrand, deleteBrand } from '../services/brandService'
import { listDeviceTypes, createDeviceType, deleteDeviceType } from '../services/deviceTypeService'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [brandName, setBrandName] = useState('')
  const [deviceTypes, setDeviceTypes] = useState<any[]>([])
  const [deviceTypeName, setDeviceTypeName] = useState('')
  // removed local password controls per request; only backup functionality remains

  async function downloadBackup() {
    setLoading(true)
    setMessage(null)
    try {
      const [clients, repairs, users] = await Promise.all([listClients(), listRepairs(), listUsers()])

      // lazy-load SheetJS only when user requests the export
      const XLSXmod = await import('xlsx')
      const XLSX = (XLSXmod && (XLSXmod.default || XLSXmod)) as any

      // Prepare sheets
      const clientsWS = XLSX.utils.json_to_sheet(clients)
      const repairsWS = XLSX.utils.json_to_sheet(repairs)
      const usersWS = XLSX.utils.json_to_sheet(users)

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, clientsWS, 'Clients')
      XLSX.utils.book_append_sheet(wb, repairsWS, 'Repairs')
      XLSX.utils.book_append_sheet(wb, usersWS, 'Users')

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
      <p>Descarga un backup completo de la base de datos en formato Excel (.xlsx). Esto incluye clientes, reparaciones y usuarios.</p>
      <div style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={downloadBackup} disabled={loading}>{loading ? 'Generando...' : 'Descargar backup (Excel)'}</button>
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
