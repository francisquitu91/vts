import React, { useEffect, useState } from 'react'
import { listUsers, createUser, updateUser, deleteUser, UserProfile } from '../services/userService'

export default function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserProfile | null>(null)
  const [localPw, setLocalPw] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (e) { console.error(e); alert('Error cargando usuarios') } finally { setLoading(false) }
  }

  function openNew() { setEditing({ role: 'admin' }); setLocalPw(''); setShowForm(true) }

  async function save(u: UserProfile) {
    try {
      if (u.id) {
        const upd = await updateUser(u.id, { ...u, local_password: localPw || null } as any)
        setUsers((s) => s.map(x => x.id === upd.id ? upd : x))
      } else {
        if (!u.email) return alert('Email requerido')
        // Create user: contraseña del formulario se guarda en la columna local_password
        const created = await createUser({ email: u.email!, password: undefined, local_password: localPw || undefined, first_name: u.first_name, last_name: u.last_name, role: u.role })
        setUsers((s) => [created, ...s])
      }
      setShowForm(false); setEditing(null)
    } catch (e) { console.error(e); alert('Error guardando usuario: ' + ((e as any)?.message || e)) }
  }

  async function remove(id?: string) {
    if (!id) return
    if (!confirm('Eliminar usuario?')) return
    try { await deleteUser(id); setUsers((s) => s.filter(x => x.id !== id)) } catch (e) { alert('Error eliminando usuario') }
  }

  // reset via email removed per request

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Lista usuarios admin</h2>
        <div>
          <button className="btn" onClick={openNew}>Nuevo usuario</button>
          <button className="btn" onClick={fetchUsers} style={{ marginLeft: 8 }}>Refrescar</button>
        </div>
      </div>
      {loading ? <div>Cargando...</div> : (
        <table className="clients-table">
          <thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Creado</th><th>Acción</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{(u.first_name || '') + ' ' + (u.last_name || '')}</td>
                <td>{u.role}</td>
                <td>{new Date(u.created_at || '').toLocaleString()}</td>
                <td>
                  <button onClick={() => { setEditing(u); setLocalPw((u as any)?.local_password || ''); setShowForm(true) }}>Editar</button>
                  <button className="btn danger" onClick={() => remove(u.id)} style={{ marginLeft: 6 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal">
          <form className="modal-content" onSubmit={(e) => { e.preventDefault(); save(editing!) }}>
            <h3>{editing?.id ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <div>
              <label>Email</label>
              <input value={editing?.email || ''} onChange={(e) => setEditing((s) => ({ ...(s||{}), email: e.target.value }))} />
            </div>
            <div>
              <label>Nombre</label>
              <input value={editing?.first_name || ''} onChange={(e) => setEditing((s) => ({ ...(s||{}), first_name: e.target.value }))} />
            </div>
            <div>
              <label>Apellido</label>
              <input value={editing?.last_name || ''} onChange={(e) => setEditing((s) => ({ ...(s||{}), last_name: e.target.value }))} />
            </div>
            <div>
              <label>Contraseña</label>
              <input type="password" value={localPw} onChange={(e) => setLocalPw(e.target.value)} />
            </div>
            <div>
              <label>Rol</label>
              <select value={editing?.role || 'worker'} onChange={(e) => setEditing((s) => ({ ...(s||{}), role: e.target.value }))}>
                <option value="admin">Administrador</option>
                <option value="worker">Trabajador</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" type="submit">Guardar</button>
              <button className="btn" type="button" onClick={() => { setShowForm(false); setEditing(null) }} style={{ marginLeft: 8 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
