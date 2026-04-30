const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'sales', label: 'Ventas', icon: '🧾' },
  { id: 'products', label: 'Productos', icon: '📦' },
  { id: 'cash', label: 'Caja', icon: '💵' },
  { id: 'reports', label: 'Reportes', icon: '📈' },
  { id: 'settings', label: 'Configuración', icon: '⚙️' }
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">TPV</div>
        <div>
          <strong>Modular</strong>
          <span>Desktop</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
