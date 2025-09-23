import React from 'react'

type Page = 'dashboard' | 'clients' | 'repairs' | 'users' | 'settings'

export default function Sidebar({ onNavigate, onLogout, page }: { onNavigate: (p: Page) => void, onLogout?: () => void, page?: Page }) {
  function Item({ id, label, icon }: { id: Page, label: string, icon: React.ReactNode }) {
    const active = page === id
    return (
      <li className={"side-item" + (active ? ' active' : '')} onClick={() => onNavigate(id)}>
        <span className="side-icon">{icon}</span>
        <span className="side-label">{label}</span>
      </li>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo-wrap">
            <img src="https://static.vecteezy.com/system/resources/previews/003/241/622/non_2x/network-connections-icon-vector.jpg" alt="logo" className="sidebar-logo" />
          </div>
          <div className="sidebar-title">VTS</div>
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
        {onLogout && <button onClick={onLogout} className="btn logout-btn">Cerrar sesión</button>}
      </div>
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
