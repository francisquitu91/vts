import React, { useEffect, useState } from 'react'
import { listRepairs, createRepair, updateRepair, deleteRepair, RepairRecord } from '../services/repairService'
import { listClients } from '../services/clientService'
import { supabaseConfigured } from '../lib/supabase'
import { listBrands } from '../services/brandService'
import { listDeviceTypes } from '../services/deviceTypeService'

export type ServiceItem = { id: string; description: string; value: number }
export type PartItem = { id: string; name: string; price: number }

export type Repair = {
  id: string
  nro: string
  clientId?: string
  clientName?: string
  clientRut?: string
  tipoDcto: 'Orden de servicio' | 'Presupuesto' | 'Comprobante'
  estadoPago: 'Pagado' | 'Pendiente'
  estadoReparacion: 'En proceso' | 'Terminado' | 'Cancelado' | 'Entregado'
  tipoPago: string
  tipoEquipo: string
  marca?: string
  modelo?: string
  serie?: string
  accesorios?: string
  falla?: string
  observacion?: string
  servicios: ServiceItem[]
  repuestos: PartItem[]
  createdAt: string
}

const STORAGE_KEY = 'crm_repairs_v1'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function RepairList() {
  const [repairs, setRepairs] = useState<RepairRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RepairRecord | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<any[]>([])
  const [deviceTypes, setDeviceTypes] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterEstadoPago, setFilterEstadoPago] = useState('')
  const [filterEstadoProceso, setFilterEstadoProceso] = useState('')
  const [filterTipoPago, setFilterTipoPago] = useState('')
  const [filterTipoDcto, setFilterTipoDcto] = useState('')

  useEffect(() => { fetchRepairs(); fetchClients() }, [])

  useEffect(() => { fetchBrands() }, [])

  useEffect(() => { fetchDeviceTypes() }, [])

  async function fetchDeviceTypes() {
    try {
      const data = await listDeviceTypes()
      setDeviceTypes(data || [])
    } catch (e) {
      console.warn('failed to load device types', e)
      setDeviceTypes([])
    }
  }

  async function fetchBrands() {
    try {
      const data = await listBrands()
      setBrands(data || [])
    } catch (e) {
      console.warn('failed to load brands', e)
      setBrands([])
    }
  }

  async function fetchRepairs() {
    setLoading(true)
    try {
      const data = await listRepairs()
      setRepairs(data)
    } catch (e) {
      console.error(e)
      alert('Error cargando reparaciones')
    } finally { setLoading(false) }
  }

  async function fetchClients() {
    try {
      // Prefer fetching from Supabase; fall back to localStorage when offline or on error
      try {
        const data = await listClients()
        setClients(data || [])
        return
      } catch (err) {
        console.warn('listClients failed, falling back to localStorage', err)
      }

      const raw = localStorage.getItem('crm_clients_v1')
      setClients(raw ? JSON.parse(raw) : [])
    } catch (e) { setClients([]) }
  }

  function openNew() {
    setEditing({
      nro: 'RSMS-' + new Date().getTime().toString().slice(-6),
      tipo_dcto: 'Orden de servicio',
      estado_pago: 'Pendiente',
      estado_reparacion: 'En proceso',
      tipo_pago: 'Efectivo',
      tipo_equipo: 'Notebook',
      marca: 'Dell',
      servicios: [],
      repuestos: [],
      created_at: new Date().toISOString(),
    })
    setShowForm(true)
  }

  async function save(r: any) {
    try {
      // sanitize payload
      const payload: any = { ...r }
      // normalize correo/telefono to trimmed strings so they are sent to Supabase
      if (payload.correo !== undefined && payload.correo !== null) payload.correo = String(payload.correo).trim()
      if (payload.telefono !== undefined && payload.telefono !== null) payload.telefono = String(payload.telefono).trim()
      payload.servicios = Array.isArray(payload.servicios) ? payload.servicios.map((s: any) => ({ id: s.id, description: s.description || '', value: Number(s.value) || Number(s.value) === 0 ? Number(s.value) : Number(s.value || s?.valor || 0) })) : []
      payload.repuestos = Array.isArray(payload.repuestos) ? payload.repuestos.map((p: any) => ({ id: p.id, name: p.name || p.nombre || '', price: Number(p.price) || Number(p.price) === 0 ? Number(p.price) : Number(p.price || p?.precio || 0) })) : []
      // remove any undefined fields to avoid supabase errors
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

      if (payload.id) {
        const saved = await updateRepair(payload.id, payload)
        setRepairs((s) => s.map((x) => x.id === saved.id ? saved : x))
      } else {
        const created = await createRepair(payload)
        setRepairs((s) => [created, ...s])
      }
      setShowForm(false)
      setEditing(null)
    } catch (e) {
      console.error('Save repair error:', e)
      const msg = (e as any)?.message || JSON.stringify(e)
      alert('Error guardando reparación: ' + msg)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar reparación?')) return
    try {
      await deleteRepair(id)
      setRepairs((s) => s.filter((r) => r.id !== id))
    } catch (e) {
      alert('Error eliminando reparación')
    }
  }

  const [appliedFilters, setAppliedFilters] = useState({
    from: '', to: '', estadoPago: '', estadoProceso: '', tipoPago: '', tipoDcto: ''
  })
  // search is live and independent from the "Filtrar" button

  function applyFilters() {
    // Only apply the explicit filters (dates, estados, tipo pago/dcto).
    // The search input (`query`) is live and filtered immediately, so we don't touch it here.
    setAppliedFilters({ from: filterFrom, to: filterTo, estadoPago: filterEstadoPago, estadoProceso: filterEstadoProceso, tipoPago: filterTipoPago, tipoDcto: filterTipoDcto })
  }

  function clearFilters() {
    setFilterFrom('')
    setFilterTo('')
    setFilterEstadoPago('')
    setFilterEstadoProceso('')
    setFilterTipoPago('')
    setFilterTipoDcto('')
    // Clear only the explicit filters; keep the search input intact so the user can continue searching.
    setAppliedFilters({ from: '', to: '', estadoPago: '', estadoProceso: '', tipoPago: '', tipoDcto: '' })
  }

  return (
    <div className="repairs">
      {!supabaseConfigured && (
        <div style={{ padding: 8, background: '#fff3cd', border: '1px solid #ffeeba', marginBottom: 12 }}>
          <strong>Advertencia:</strong> Supabase no está configurado. La aplicación usará datos locales (localStorage). Configure `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
        </div>
      )}
      <div className="clients-header">
        <h2>Lista de Reparaciones</h2>
      </div>

      <div className="repairs-controls">
        <div className="filters-row">
          <div>
            <label>Fecha Inicial:</label>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <label>Fecha Final:</label>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <div>
            <label>Estado Pago:</label>
            <select value={filterEstadoPago} onChange={(e) => setFilterEstadoPago(e.target.value)}>
              <option value="">Todos</option>
              <option>Pagado</option>
              <option>Pendiente</option>
            </select>
          </div>
          <div>
            <label>Estado Proceso:</label>
            <select value={filterEstadoProceso} onChange={(e) => setFilterEstadoProceso(e.target.value)}>
              <option value="">Todos</option>
              <option>En proceso</option>
              <option>Terminado</option>
              <option>Cancelado</option>
              <option>Entregado</option>
            </select>
          </div>
          <div>
            <label>Metodo Pago:</label>
            <select value={filterTipoPago} onChange={(e) => setFilterTipoPago(e.target.value)}>
              <option value="">Todos</option>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label>Tipo Dcto:</label>
            <select value={filterTipoDcto} onChange={(e) => setFilterTipoDcto(e.target.value)}>
              <option value="">Todos</option>
              <option>Orden de servicio</option>
              <option>Presupuesto</option>
              <option>Comprobante</option>
            </select>
          </div>
          <div className="btn-group">
            <button type="button" className="btn primary" onClick={applyFilters}>Filtrar</button>
            <button type="button" className="btn" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
        <div style={{ marginLeft: 12 }}>
          <input
            className="repairs-search"
            placeholder="Buscar por Nro, Cliente, Equipo, Marca, Modelo, Serie o Observación..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>


  {loading ? <div>Cargando...</div> : (
  <div className="table-wrap">
    <table className="clients-table repairs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Nro</th>
            <th>Cliente (RUT)</th>
            <th>Estado Pago</th>
            <th>Estado Reparación</th>
            <th>Tipo Pago</th>
            <th>Tipo Equipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serie</th>
            <th>Accesorios</th>
            <th>Falla</th>
            <th>Observación</th>
            <th>Valor Neto</th>
            <th>IVA</th>
            <th>Total</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {repairs.filter((r) => {
            // date filters
            if (appliedFilters.from) {
              const d = new Date(r.created_at || '')
              if (isNaN(d.getTime()) || d < new Date(appliedFilters.from)) return false
            }
            if (appliedFilters.to) {
              const d = new Date(r.created_at || '')
              // include the whole day
              const toEnd = new Date(appliedFilters.to)
              toEnd.setHours(23,59,59,999)
              if (isNaN(d.getTime()) || d > toEnd) return false
            }
            if (appliedFilters.estadoPago && (r.estado_pago || '') !== appliedFilters.estadoPago) return false
            if (appliedFilters.estadoProceso && (r.estado_reparacion || '') !== appliedFilters.estadoProceso) return false
            if (appliedFilters.tipoPago && (r.tipo_pago || '') !== appliedFilters.tipoPago) return false
            if (appliedFilters.tipoDcto && (r.tipo_dcto || '') !== appliedFilters.tipoDcto) return false

            // live search: use the current query input
            if (!query) return true
            const q = query.toLowerCase()
            // include date (formatted), estado_pago, falla, accesorios and numeric totals in search
            const dateStr = (() => {
              try {
                const d = new Date(r.created_at || '')
                return isNaN(d.getTime()) ? '' : d.toLocaleDateString()
              } catch (e) { return '' }
            })()
            const servicios = r.servicios || []
            const repuestos = r.repuestos || []
            const netVal = servicios.reduce((a: number, b: any) => a + (b.value || 0), 0) + repuestos.reduce((a: number, b: any) => a + (b.price || 0), 0)
            const ivaVal = +(netVal * 0.19).toFixed(2)
            const totalVal = +(netVal + ivaVal).toFixed(2)

            const candidates = [
              r.nro,
              r.client_name,
              r.client_rut,
              r.tipo_equipo,
              r.marca,
              r.modelo,
              r.serie,
              r.observacion,
              r.falla,
              r.accesorios,
              r.estado_pago,
              dateStr,
              netVal.toString(),
              ivaVal.toString(),
              totalVal.toString()
            ]

            return candidates.some((f) => (f || '').toString().toLowerCase().includes(q))
          }).map((r, i) => {
            const servicios = r.servicios || []
            const repuestos = r.repuestos || []
            const net = servicios.reduce((a: number, b: any) => a + (b.value || 0), 0) + repuestos.reduce((a: number, b: any) => a + (b.price || 0), 0)
            const iva = +(net * 0.19).toFixed(2)
            const total = +(net + iva).toFixed(2)
            return (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{new Date(r.created_at || '').toLocaleDateString()}</td>
                <td>{r.nro}</td>
                <td>{r.client_name ?? '-'} {r.client_rut ? `(${r.client_rut})` : ''}</td>
                <td>{r.estado_pago}</td>
                <td>{r.estado_reparacion}</td>
                <td>{r.tipo_pago}</td>
                <td>{r.tipo_equipo}</td>
                <td>{r.marca}</td>
                <td>{r.modelo}</td>
                <td>{r.serie}</td>
                <td>{r.accesorios}</td>
                <td>{r.falla}</td>
                <td>{r.observacion}</td>
                <td>{net.toLocaleString()}</td>
                <td>{iva.toLocaleString()}</td>
                <td>{total.toLocaleString()}</td>
                <td>
                  <button onClick={() => { setEditing(r); setShowForm(true) }}>Editar</button>
                  <button className="btn danger" onClick={() => remove(r.id as string)}>Eliminar</button>
                </td>
              </tr>
            )
          })}
        </tbody>
    </table>
  </div>
      )}

      {showForm && editing && (
        <RepairForm initial={editing} clients={clients} brands={brands} deviceTypes={deviceTypes} onCancel={() => { setShowForm(false); setEditing(null) }} onSave={save} />
      )}

      {/* Floating action button */}
      <button className="fab primary" onClick={openNew} title="Nuevo">+ Nuevo</button>
    </div>
  )
}

function RepairForm({ initial, onSave, onCancel, clients, brands, deviceTypes }: { initial: RepairRecord, onSave: (r: RepairRecord) => void, onCancel: () => void, clients: any[], brands: any[], deviceTypes: any[] }) {
  const [data, setData] = useState<RepairRecord>(initial)
  const [svcDesc, setSvcDesc] = useState('')
  const [svcVal, setSvcVal] = useState('0')
  const [partName, setPartName] = useState('')
  const [partPrice, setPartPrice] = useState('0')
  const [printUrl, setPrintUrl] = useState<string | null>(null)

  useEffect(() => setData(initial), [initial])

  function update<K extends keyof RepairRecord>(k: K, v: any) {
    setData((d) => ({ ...d, [k]: v }))
  }

  function addService() {
    if (!svcDesc) return
    const item: ServiceItem = { id: uid(), description: svcDesc, value: parseFloat(svcVal) || 0 }
    setData((d) => ({ ...d, servicios: [...(d.servicios || []), item] }))
    setSvcDesc('')
    setSvcVal('0')
  }

  function addPart() {
    if (!partName) return
    const p: PartItem = { id: uid(), name: partName, price: parseFloat(partPrice) || 0 }
    setData((d) => ({ ...d, repuestos: [...(d.repuestos || []), p] }))
    setPartName('')
    setPartPrice('0')
  }

  function removeService(id: string) {
    setData((d) => ({ ...d, servicios: (d.servicios || []).filter((s) => s.id !== id) }))
  }

  function removePart(id: string) {
    setData((d) => ({ ...d, repuestos: (d.repuestos || []).filter((p) => p.id !== id) }))
  }

  const net = (data.servicios || []).reduce((a: number, b: any) => a + (b.value || 0), 0) + (data.repuestos || []).reduce((a: number, b: any) => a + (b.price || 0), 0)
  const iva = +(net * 0.19).toFixed(2)
  const total = +(net + iva).toFixed(2)

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    onSave({ ...data, servicios: data.servicios || [], repuestos: data.repuestos || [], id: data.id })
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('es-CL')
  }

  function printRepair(r: RepairRecord) {
    const servicios = r.servicios || []
    const repuestos = r.repuestos || []
    const net = (servicios || []).reduce((a: number, b: any) => a + (b.value || 0), 0) + (repuestos || []).reduce((a: number, b: any) => a + (b.price || 0), 0)
    const iva = +(net * 0.19).toFixed(2)
    const total = +(net + iva).toFixed(2)
    // Use external logo URL as requested
    const logo = 'https://valpotec.cl/wp-content/uploads/2024/07/LOGO.png'
    const when = new Date(r.created_at || new Date()).toLocaleString()

    const rowsServicios = (servicios || []).map((s: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${(s.description||'')}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(Number(s.value||0))}</td></tr>`).join('')
    const rowsRepuestos = (repuestos || []).map((p: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${(p.name||'')}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(Number(p.price||0))}</td></tr>`).join('')

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Reparación ${r.nro}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#333}
          .header{display:flex;align-items:center;gap:16px}
          .company{margin-left:12px}
          .section{margin-top:24px}
          table{width:100%;border-collapse:collapse}
          .totals td{padding:12px;border:1px solid #ddd}
          .signature{margin-top:18px;white-space:pre-line}
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logo}" style="width:180px" />
          <div class="company">
            <div><strong>Valpotec</strong></div>
            <div>Av. Valparaíso 694 Of. 112-C - Viña del Mar</div>
            <div>servicios@valpotec.cl</div>
          </div>
        </div>

        <hr />

        <h2>Datos de Contacto</h2>
        <table style="margin-top:8px">
          <tr><td style="width:220px;font-weight:600;padding:8px;border:1px solid #eee">Tipo Dcto</td><td style="padding:8px;border:1px solid #eee">${r.tipo_dcto || ''} - ${r.nro || ''}</td></tr>
          <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Fecha</td><td style="padding:8px;border:1px solid #eee">${when}</td></tr>
          <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Cliente</td><td style="padding:8px;border:1px solid #eee">${r.client_name || ''} ${r.client_rut ? ` - Rut: ${r.client_rut}` : ''}</td></tr>
          <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Contacto</td><td style="padding:8px;border:1px solid #eee">${r.correo || ''}${r.correo && r.telefono ? ' - ' : ''}${r.telefono || ''}</td></tr>
          <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Tipo de Pago</td><td style="padding:8px;border:1px solid #eee">${r.tipo_pago || ''}</td></tr>
          <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Requerimiento</td><td style="padding:8px;border:1px solid #eee">${r.falla || ''}</td></tr>
        </table>

        <div class="section">
          <h3>Información Equipo</h3>
          <table style="margin-top:8px">
            <tr><td style="width:220px;font-weight:600;padding:8px;border:1px solid #eee">Tipo Equipo</td><td style="padding:8px;border:1px solid #eee">${r.tipo_equipo || ''}</td></tr>
            <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Marca</td><td style="padding:8px;border:1px solid #eee">${r.marca || ''}</td></tr>
            <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Modelo</td><td style="padding:8px;border:1px solid #eee">${r.modelo || ''}</td></tr>
            <tr><td style="font-weight:600;padding:8px;border:1px solid #eee">Serie</td><td style="padding:8px;border:1px solid #eee">${r.serie || ''}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Observaciones</h3>
          <div style="padding:8px;border:1px solid #eee;background:#fff">${r.observacion || '-'}</div>
        </div>

        <div class="section">
          <h3>Servicios</h3>
          <table>
            <thead><tr><th style="text-align:left;padding:8px;background:#f7f7f7;border:1px solid #eee">Detalle de Servicios</th><th style="text-align:right;padding:8px;background:#f7f7f7;border:1px solid #eee">Precio</th></tr></thead>
            <tbody>
              ${rowsServicios || '<tr><td style="padding:8px;border-bottom:1px solid #eee">-</td><td style="padding:8px;border-bottom:1px solid #eee">-</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Repuestos</h3>
          <table>
            <thead><tr><th style="text-align:left;padding:8px;background:#f7f7f7;border:1px solid #eee">Detalle de Repuestos</th><th style="text-align:right;padding:8px;background:#f7f7f7;border:1px solid #eee">Precio</th></tr></thead>
            <tbody>
              ${rowsRepuestos || '<tr><td style="padding:8px;border-bottom:1px solid #eee">-</td><td style="padding:8px;border-bottom:1px solid #eee">-</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Totales</h3>
          <table class="totals" style="width:60%">
            <tr><td style="font-weight:600">Valor Neto</td><td style="text-align:right">${formatCurrency(net)}</td></tr>
            <tr><td style="font-weight:600">I.V.A.</td><td style="text-align:right">${formatCurrency(iva)}</td></tr>
            <tr><td style="font-weight:600">Total</td><td style="text-align:right">${formatCurrency(total)}</td></tr>
          </table>

          <div class="signature">Atte.
Víctor Sanhueza Puentes
Centro Autorizado DELL V Región
</div>
        </div>

        <script>setTimeout(()=>{window.print();},250);</script>
      </body>
      </html>
    `

    try {
      const blob = new Blob([html], { type: 'text/html' })
      const urlBlob = URL.createObjectURL(blob)
      const w = window.open(urlBlob, '_blank', 'noopener')
      console.debug('[printRepair] opened window', w)
      if (!w) {
        // Popup was blocked. Instead of auto-downloading, keep the blob URL in state and
        // show a small UI so the user can choose when/how to open or copy the link.
        console.warn('[printRepair] popup blocked, storing blob URL for user action')
        setPrintUrl(urlBlob)
        // schedule a revoke after a generous timeout (2 minutes) in case user ignores it
        setTimeout(() => { try { if (printUrl) { URL.revokeObjectURL(urlBlob); } } catch (e) {} }, 120000)
        return
      }
      // release object URL after a short time
      setTimeout(() => { try { URL.revokeObjectURL(urlBlob) } catch (e) {} }, 5000)
    } catch (err) {
      console.error('[printRepair] failed to open blob window', err)
      // As a last-resort fallback, set the print URL so the user may open it manually
      try {
        const fallback = new Blob([html], { type: 'text/html' })
        const fallbackUrl = URL.createObjectURL(fallback)
        setPrintUrl(fallbackUrl)
        setTimeout(() => { try { URL.revokeObjectURL(fallbackUrl) } catch (e) {} }, 120000)
      } catch (e) {
        console.error('[printRepair] fallback failed too', e)
      }
    }
  }

  const clientDisplayName = (c: any) => {
    return [c.first_name ?? c.firstName, c.middle_name ?? c.middleName, c.last_name ?? c.lastName].filter(Boolean).join(' ')
  }

  const selectedClientExists = data.client_id ? clients.some((x: any) => x.id === data.client_id) : false

  return (
    <div className="modal">
  <form className="modal-content" onSubmit={submit}>
        <h3>Actualizar Reparación</h3>
        <div className="form-row">
          <div>
            <label>Cliente</label>
            <select value={data.client_id || ''} onChange={(e) => {
              const id = e.target.value
              const c = clients.find((x: any) => x.id === id)
              update('client_id', id)
              update('client_name', c ? clientDisplayName(c) : '')
              update('client_rut', c ? (c.document ?? c.rut ?? '') : '')
              // prefill correo/telefono from client when available
              update('correo', c ? (c.email ?? c.correo ?? '') : '')
              update('telefono', c ? (c.contact ?? c.telefono ?? '') : '')
            }}>
              <option value="">-- Seleccionar cliente --</option>
              {/* If editing and the client is not in the clients list, show it as a selectable option so the select displays correctly */}
              {data.client_id && !selectedClientExists && (
                <option value={data.client_id}>{data.client_name || `Cliente (${data.client_id})`}</option>
              )}
              {clients.map((c: any) => <option key={c.id} value={c.id}>{clientDisplayName(c)} { (c.document ?? c.rut) ? `(${c.document ?? c.rut})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label>Número</label>
            <input value={data.nro || ''} onChange={(e) => update('nro', e.target.value)} />
          </div>
          <div>
            <label>Tipo Documento</label>
            <select value={data.tipo_dcto || ''} onChange={(e) => update('tipo_dcto', e.target.value)}>
              <option>Orden de servicio</option>
              <option>Presupuesto</option>
              <option>Comprobante</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Correo</label>
            <input value={data.correo || ''} onChange={(e) => update('correo', e.target.value)} />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={data.telefono || ''} onChange={(e) => update('telefono', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Estado Pago</label>
            <select value={data.estado_pago || ''} onChange={(e) => update('estado_pago', e.target.value)}>
              <option>Pagado</option>
              <option>Pendiente</option>
            </select>
          </div>
          <div>
            <label>Estado Reparación</label>
            <select value={data.estado_reparacion || ''} onChange={(e) => update('estado_reparacion', e.target.value)}>
              <option>En proceso</option>
              <option>Terminado</option>
              <option>Cancelado</option>
              <option>Entregado</option>
            </select>
          </div>
          <div>
            <label>Tipo Pago</label>
            <select value={data.tipo_pago || ''} onChange={(e) => update('tipo_pago', e.target.value)}>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Otro</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Tipo Equipo</label>
            <select value={data.tipo_equipo || ''} onChange={(e) => update('tipo_equipo', e.target.value)}>
              <option value="">-- Seleccionar tipo --</option>
              {deviceTypes.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label>Marca</label>
            <select value={data.marca || ''} onChange={(e) => update('marca', e.target.value)}>
              <option value="">-- Seleccionar marca --</option>
              {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label>Modelo</label>
            <input value={data.modelo || ''} onChange={(e) => update('modelo', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Serie</label>
            <input value={data.serie || ''} onChange={(e) => update('serie', e.target.value)} />
          </div>
          <div>
            <label>Accesorios</label>
            <input value={data.accesorios || ''} onChange={(e) => update('accesorios', e.target.value)} />
          </div>
          <div>
            <label>Observación</label>
            <textarea value={data.observacion || ''} onChange={(e) => update('observacion', e.target.value)} />
          </div>
        </div>

        <div>
          <label>Falla reportada / Requerimiento</label>
          <textarea value={data.falla || ''} onChange={(e) => update('falla', e.target.value)} />
        </div>

        <hr />
        <h4>Servicios</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Detalle servicio" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
          <input placeholder="Precio" value={svcVal} onChange={(e) => setSvcVal(e.target.value)} />
          <button type="button" className="btn" onClick={addService}>Agregar</button>
        </div>
        <table className="clients-table" style={{ marginBottom: 12 }}>
          <thead><tr><th>Descripción</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {(data.servicios || []).map((s: any) => (
              <tr key={s.id}><td>{s.description}</td><td>{s.value}</td><td><button onClick={() => removeService(s.id)}>Eliminar</button></td></tr>
            ))}
          </tbody>
        </table>

        <h4>Repuestos</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Nombre repuesto" value={partName} onChange={(e) => setPartName(e.target.value)} />
          <input placeholder="Precio" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} />
          <button type="button" className="btn" onClick={addPart}>Agregar</button>
        </div>
        <table className="clients-table" style={{ marginBottom: 12 }}>
          <thead><tr><th>Nombre</th><th>Precio</th><th></th></tr></thead>
          <tbody>
            {(data.repuestos || []).map((p: any) => (
              <tr key={p.id}><td>{p.name}</td><td>{p.price}</td><td><button onClick={() => removePart(p.id)}>Eliminar</button></td></tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <div>
            <div>Neto: {net.toLocaleString()}</div>
            <div>IVA: {iva.toLocaleString()}</div>
            <div>Total: {total.toLocaleString()}</div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => printRepair(data)} style={{ marginRight: 8 }}>Imprimir</button>
          <button type="submit" className="btn primary">Guardar</button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
        {printUrl && (
          <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', background: '#fafafa' }}>
            <div style={{ marginBottom: 8 }}>Se generó una vista imprimible pero el navegador bloqueó la apertura automática.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => window.open(printUrl, '_blank', 'noopener')}>Abrir en nueva pestaña</button>
              <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(printUrl); console.debug('copied print url') } catch (e) { console.error('copy failed', e) } }}>Copiar enlace</button>
              <button className="btn" onClick={() => { try { URL.revokeObjectURL(printUrl) } catch (e) {} setPrintUrl(null) }}>Descartar</button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
