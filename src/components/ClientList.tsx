import React, { useEffect, useState } from 'react'
import ClientForm, { Client } from './ClientForm'
import { listClients, createClient, updateClient, deleteClient, ClientRecord } from '../services/clientService'

export default function ClientList() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [editing, setEditing] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    try {
      const data = await listClients()
      setClients(data)
    } catch (e) {
      console.error(e)
      alert('Error cargando clientes')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(c: Client) {
    try {
      const created = await createClient({
        first_name: c.firstName,
        middle_name: c.middleName,
        last_name: c.lastName,
        document: c.document,
        email: c.email,
        contact: c.contact,
        address: c.address,
      })
      setClients((s) => [created, ...s])
      setShowForm(false)
    } catch (e) {
      alert('Error creando cliente')
    }
  }

  async function handleUpdate(updated: Client) {
    if (!updated.id) return
    try {
      const saved = await updateClient(updated.id, {
        first_name: updated.firstName,
        middle_name: updated.middleName,
        last_name: updated.lastName,
        document: updated.document,
        email: updated.email,
        contact: updated.contact,
        address: updated.address,
      })
      setClients((s) => s.map((c) => (c.id === saved.id ? saved : c)))
      setEditing(null)
      setShowForm(false)
    } catch (e) {
      alert('Error actualizando cliente')
    }
  }

  async function handleDelete(id: string | undefined) {
    if (!id) return
    if (!confirm('Eliminar cliente?')) return
    try {
      await deleteClient(id as string)
      setClients((s) => s.filter((c) => c.id !== id))
    } catch (e) {
      alert('Error eliminando cliente')
    }
  }

  return (
    <div className="clients">
      <div className="clients-header">
        <h2>Lista de Clientes</h2>
      </div>
      {loading ? <div>Cargando...</div> : (
        <table className="clients-table">
          <thead>
            <tr><th>#</th><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Correo</th><th>DNI</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr key={c.id as string}>
                <td>{i + 1}</td>
                <td>{new Date(c.created_at || '').toLocaleString()}</td>
                <td>{[c.first_name, c.middle_name, c.last_name].filter(Boolean).join(' ')}</td>
                <td>{c.contact}</td>
                <td>{c.email}</td>
                <td>{c.document}</td>
                <td>
                  <button onClick={() => { setEditing({ id: c.id as string, firstName: c.first_name || '', middleName: c.middle_name || '', lastName: c.last_name || '', document: c.document || '', email: c.email || '', contact: c.contact || '', address: c.address || '' }); setShowForm(true) }}>Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <ClientForm
          initial={editing ?? undefined}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          onSave={(c) => (editing ? handleUpdate(c) : handleAdd(c))}
        />
      )}

      {/* Floating action button for adding clients */}
      <button className="fab primary" onClick={() => { setShowForm(true); setEditing(null) }} title="Agregar Cliente">+ Agregar Cliente</button>
    </div>
  )
}
