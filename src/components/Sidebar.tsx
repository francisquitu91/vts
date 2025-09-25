import React from 'react'

type Page = 'dashboard' | 'clients' | 'repairs' | 'users' | 'settings'

export default function Sidebar({ onNavigate, onLogout, page }: { onNavigate: (p: Page) => void, onLogout?: () => void, page?: Page }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      // if switching to mobile, start collapsed; if switching to desktop, ensure expanded
      if (mobile) setCollapsed(true)
      else setCollapsed(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function Item({ id, label, icon }: { id: Page, label: string, icon: React.ReactNode }) {
    const active = page === id
    return (
      <li className={"side-item" + (active ? ' active' : '')} onClick={() => onNavigate(id)}>
        <span className="side-icon">{icon}</span>
        {!collapsed && <span className="side-label">{label}</span>}
      </li>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside className={"sidebar" + (collapsed ? ' collapsed' : '')}>
        <div className="sidebar-top">
          <div style={{display:'flex',alignItems:'center',gap:8,width:'100%'}}>
            <div className="sidebar-logo-wrap">
              <img src="https://static.vecteezy.com/system/resources/previews/003/241/622/non_2x/network-connections-icon-vector.jpg" alt="logo" className="sidebar-logo" />
            </div>
            {!collapsed && <div className="sidebar-title">VTS</div>}
            <button className="collapse-toggle" aria-label={collapsed ? 'Expandir barra' : 'Contraer barra'} onClick={() => setCollapsed((s) => !s)} style={{marginLeft:'auto',background:'transparent',border:0,cursor:'pointer'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        <ul className="side-list">
        <Item id="dashboard" label="Panel" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-8H3v8z" fill="currentColor"/></svg>} />
        <Item id="repairs" label="Lista de Reparaciones" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 8V7l-3 2-2-2-4 3-3-2-3 2v6h18V8z" fill="currentColor"/></svg>} />
        <Item id="clients" label="Lista de Clientes" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5C22 14.17 17.33 13 16 13z" fill="currentColor"/></svg>} />

  <div className="side-section">Mantenimiento</div>
  <Item id="users" label="Lista usuarios admin" icon={<span className="side-icon">👥</span>} />
  <Item id="settings" label="Configuración" icon={<span className="side-icon">⚙️</span>} />
      </ul>

      <div className="sidebar-bottom">
        {onLogout && (
          <button onClick={onLogout} className="btn logout-btn">
            {collapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3H4c-1.1 0-2 .9-2 2v2h2V5h16v14H4v-2H2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
            ) : (
              'Cerrar sesión'
            )}
          </button>
        )}
        {collapsed && (
          <button className="expand-toggle" aria-label="Expandir barra" onClick={() => setCollapsed(false)} style={{marginTop:8,background:'rgba(255,255,255,0.12)',border:0,cursor:'pointer',width:40,height:40,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
        {isMobile && !collapsed && (
          <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />
        )}
      </aside>
      <div className="brand-top">
        <div className="brand-row">
          <div className="brand-track" aria-hidden="true">
            {/* render logos repeated several times to ensure the track fills the viewport */}
            {(() => {
              const logos = [
                'https://valpotec.cl/wp-content/uploads/elementor/thumbs/lenovo-1-qo9psabeb0jcrn73dwxo4wpm60zfwqcec7jjbunipw.png',
                'https://valpotec.cl/wp-content/uploads/elementor/thumbs/dell-2-qo9ps9dk46i2g18gjej1key5kn42p18o02w1ukoww4.png',
                'https://valpotec.cl/wp-content/uploads/elementor/thumbs/msi-1-qo9psabeb0jcrn73dwxo4wpm60zfwqcec7jjbunipw.png',
                'https://valpotec.cl/wp-content/uploads/elementor/thumbs/pngwing.com_-1-qo9psc72oolxev4d2xqx9w8jcsq6c4jv0guiaekqdg.png',
                'https://valpotec.cl/wp-content/uploads/elementor/thumbs/samsung-2-qo9psd4wvin7qh2zxg5judzzy6ljjtnlclhzrojc78.png',
                'https://static.vecteezy.com/system/resources/previews/014/414/662/non_2x/asus-logo-on-transparent-background-free-vector.jpg'
              ]
              const repeats = 4
              return Array.from({ length: repeats }).map((_, r) => (
                <React.Fragment key={r}>
                  {logos.map((src, i) => (
                    <img key={`${r}-${i}`} src={src} alt={`logo-${i}`} />
                  ))}
                </React.Fragment>
              ))
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
