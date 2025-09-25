import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listClients } from '../services/clientService'
import { listRepairs, getTotalHistoric } from '../services/repairService'

export default function Dashboard() {
  const [clientsCount, setClientsCount] = useState<number | null>(null)
  const [repairsCount, setRepairsCount] = useState<number | null>(null)
  const [pendingRepairs, setPendingRepairs] = useState<number | null>(null)
  const [servicesCount, setServicesCount] = useState<number | null>(null)
  const [approvedRepairs, setApprovedRepairs] = useState<number | null>(null)
  const [inProgressCount, setInProgressCount] = useState<number | null>(null)
  const [deliveredCount, setDeliveredCount] = useState<number | null>(null)
  const [inReviewCount, setInReviewCount] = useState<number | null>(null)
  const [finishedCount, setFinishedCount] = useState<number | null>(null)
  const [canceledCount, setCanceledCount] = useState<number | null>(null)
  const [totalHistoric, setTotalHistoric] = useState<number | null>(null)
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [recentRepairs, setRecentRepairs] = useState<any[]>([])

  async function refresh() {
    try {
      const clients = await listClients()
      setClientsCount(clients.length)
      setRecentClients(clients.slice(0, 5))
    } catch (e) {
      console.error('Error loading clients for dashboard', e)
    }
    try {
      const repairs = await listRepairs()
      setRepairsCount(repairs.length)
      // derive counts for dashboard tiles
      setServicesCount(repairs.reduce((acc: number, r: any) => acc + ((r.servicios || []).length || 0), 0))
      // pending = pending payment
      setPendingRepairs(repairs.filter((r) => (r.estado_pago || '').toString() === 'Pendiente').length)
      // approved = paid
      setApprovedRepairs(repairs.filter((r) => (r.estado_pago || '').toString() === 'Pagado').length)
      setInProgressCount(repairs.filter((r) => (r.estado_reparacion || '').toString() === 'En proceso').length)
      setDeliveredCount(repairs.filter((r) => (r.estado_reparacion || '').toString() === 'Entregado').length)
      setInReviewCount(repairs.filter((r) => (r.estado_reparacion || '').toString() === 'En revisión').length)
      setFinishedCount(repairs.filter((r) => ['Terminado', 'Entregado'].includes((r.estado_reparacion || '').toString())).length)
      setCanceledCount(repairs.filter((r) => (r.estado_reparacion || '').toString() === 'Cancelado').length)
      // fetch historic total from Supabase RPC
      try {
        const hist = await getTotalHistoric()
        setTotalHistoric(hist)
      } catch (e) {
        console.error('Error fetching historic total', e)
        setTotalHistoric(null)
      }
      setRecentRepairs(repairs.slice(0, 5))
    } catch (e) {
      console.error('Error loading repairs for dashboard', e)
    }
  }

  useEffect(() => {
    refresh()

    const clientSub = supabase
      .channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        refresh()
      }).subscribe()

    const repairSub = supabase
      .channel('public:repairs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, () => {
        refresh()
      }).subscribe()

    return () => {
      // unsubscribe
      try { clientSub.unsubscribe() } catch {};
      try { repairSub.unsubscribe() } catch {};
    }
  }, [])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-wrap">
          <h1 className="dashboard-title">Bienvenido al sistema Valpotec</h1>
          <div className="dashboard-subtitle">Panel Admin</div>
        </div>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">👥</div>
              <div className="card-label">Total de clientes</div>
            </div>
            <div className="card-value">{clientsCount ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">⏳</div>
              <div className="card-label">Reparaciones pendientes</div>
            </div>
            <div className="card-value">{pendingRepairs ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">✅</div>
              <div className="card-label">Reparaciones pagadas</div>
            </div>
            <div className="card-value">{approvedRepairs ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">💰</div>
              <div className="card-label">Total histórico</div>
            </div>
            <div className="card-value">
              {totalHistoric !== null ? totalHistoric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">🔨</div>
              <div className="card-label">Reparaciones en proceso</div>
            </div>
            <div className="card-value">{inProgressCount ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">📦</div>
              <div className="card-label">Reparaciones entregadas</div>
            </div>
            <div className="card-value">{deliveredCount ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">🏁</div>
              <div className="card-label">Reparaciones finalizadas</div>
            </div>
            <div className="card-value">{finishedCount ?? '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div className="card-left">
              <div className="card-icon">❌</div>
              <div className="card-label">Canceladas</div>
            </div>
            <div className="card-value">{canceledCount ?? '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 6 }}>
          <h4>Clientes recientes</h4>
          <ul>
            {recentClients.map((c) => <li key={c.id}>{[c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ')} {c.document ? `(${c.document})` : ''}</li>)}
          </ul>
        </div>
        <div style={{ flex: 2, background: '#fff', padding: 12, borderRadius: 6 }}>
          <h4>Reparaciones recientes</h4>
          <table className="clients-table" style={{ marginBottom: 0 }}>
            <thead><tr><th>Nro</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Total</th></tr></thead>
            <tbody>
              {recentRepairs.map((r) => {
                const servicios = r.servicios || []
                const repuestos = r.repuestos || []
                const net = servicios.reduce((a: number, b: any) => a + (b.value || 0), 0) + repuestos.reduce((a: number, b: any) => a + (b.price || 0), 0)
                const iva = +(net * 0.19).toFixed(2)
                const total = +(net + iva).toFixed(2)
                return (<tr key={r.id}><td>{r.nro}</td><td>{r.client_name}</td><td>{r.tipo_equipo}</td><td>{r.estado_reparacion}</td><td>{total.toLocaleString()}</td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
