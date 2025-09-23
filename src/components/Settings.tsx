import React, { useState } from 'react'
import { listClients } from '../services/clientService'
import { listRepairs } from '../services/repairService'
import { listUsers } from '../services/userService'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
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

  return (
    <div style={{ padding: 8 }}>
      <h3>Configuración</h3>
      <p>Descarga un backup completo de la base de datos en formato Excel (.xlsx). Esto incluye clientes, reparaciones y usuarios.</p>
      <div style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={downloadBackup} disabled={loading}>{loading ? 'Generando...' : 'Descargar backup (Excel)'}</button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}

      {/* local password controls removed as requested */}
    </div>
  )
}
