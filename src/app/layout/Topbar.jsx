export default function Topbar({ business, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h1>{business.name}</h1>
        <p>Modo activo: {business.type}</p>
      </div>

      <div className="topbar-actions">
        <span className="status-pill">Caja pendiente</span>
        <button className="btn btn-secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
