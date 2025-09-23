import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Try sign in with Supabase Auth first
      const { data, error: signError } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (!signError && data?.user) {
        const user = data.user
        // check profile exists and role is admin
        const { data: profile, error: profErr } = await supabase.from('users').select('*').eq('email', email).maybeSingle()
        if (profErr) { setError('Error al leer perfil de usuario'); return }
        if (!profile || profile.role !== 'admin') {
          try { await supabase.auth.signOut() } catch {}
          setError('Acceso denegado: no es un usuario admin')
          return
        }
        localStorage.setItem('crm_session', JSON.stringify({ user: email, uid: user.id }))
        onSuccess()
        return
      }

      // If Supabase sign-in failed, check for a local admin password stored in public.users.local_password
      try {
        const { data: profile, error: profErr } = await supabase.from('users').select('*, local_password').eq('email', email).maybeSingle()
        if (profErr) { setError('Error al leer perfil de usuario'); return }
        if (profile && profile.local_password && profile.local_password === pass && profile.role === 'admin') {
          // succeed using local password (no Supabase session)
          localStorage.setItem('crm_session', JSON.stringify({ user: email, method: 'local-pass' }))
          onSuccess()
          return
        }
      } catch (e) {
        // ignore and continue
      }

      setError('Credenciales inválidas')
    } catch (err: any) {
      console.error(err)
      setError('Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-overlay" />
      <form className="login-box" onSubmit={submit}>
        <div className="login-logo">
          <div className="login-title">Valpotec System - Admin</div>
        </div>
        {error && <div className="error">{error}</div>}
        <div>
          <label>Correo electrónico</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </div>
        {/* Dev bypass removed */}
      </form>
    </div>
  )
}
