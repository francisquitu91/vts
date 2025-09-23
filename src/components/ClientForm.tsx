import React, { useState } from 'react'

export type Client = {
  id?: string
  firstName: string
  middleName?: string
  lastName?: string
  document?: string
  email?: string
  contact?: string
  address?: string
}

export default function ClientForm({ initial, onSave, onCancel }: { initial?: Client, onSave: (c: Client) => void, onCancel: () => void }) {
  const [data, setData] = useState<Client>(
    initial ?? { id: '', firstName: '', middleName: '', lastName: '', document: '', email: '', contact: '', address: '' }
  )

  function update<K extends keyof Client>(k: K, v: Client[K]) {
    setData((d) => ({ ...d, [k]: v }))
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    onSave(data)
  }

  return (
    <div className="modal">
      <form className="modal-content" onSubmit={submit}>
        <h3>{initial ? 'Actualizar cliente' : 'Agregar nuevo cliente'}</h3>
        <div className="form-row">
          <div>
            <label>Nombre</label>
            <input value={data.firstName} onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div>
            <label>Segundo nombre (opcional)</label>
            <input value={data.middleName} onChange={(e) => update('middleName', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Apellido</label>
            <input value={data.lastName} onChange={(e) => update('lastName', e.target.value)} />
          </div>
          <div>
            <label>Documento de Identidad</label>
            <input value={data.document} onChange={(e) => update('document', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Correo electrónico</label>
            <input value={data.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={data.contact} onChange={(e) => update('contact', e.target.value)} />
          </div>
        </div>
        <div>
          <label>Dirección</label>
          <textarea value={data.address} onChange={(e) => update('address', e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn primary">Guardar</button>
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
