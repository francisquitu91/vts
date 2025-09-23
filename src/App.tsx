import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ClientList from './components/ClientList'
import RepairList from './components/RepairList'
import UserList from './components/UserList'
import Settings from './components/Settings'
import Login from './components/Login'

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'clients' | 'repairs' | 'users' | 'settings'>('dashboard')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem('crm_session')
      if (s) setAuthed(true)
    } catch {}
  }, [])

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={(p) => setPage(p)} onLogout={() => { localStorage.removeItem('crm_session'); setAuthed(false) }} />
      <main className="main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'clients' && <ClientList />}
        {page === 'repairs' && <RepairList />}
  {page === 'users' && <UserList />}
  {page === 'settings' && <Settings />}
      </main>
    </div>
  )
}
