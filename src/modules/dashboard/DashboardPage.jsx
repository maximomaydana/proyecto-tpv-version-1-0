export default function DashboardPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen general del comercio.</p>
        </div>
        <button className="btn btn-primary">Abrir caja</button>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Ventas de hoy</span>
          <strong>$0</strong>
          <small>Sin ventas registradas</small>
        </article>

        <article className="stat-card">
          <span>Cantidad de ventas</span>
          <strong>0</strong>
          <small>Operaciones del día</small>
        </article>

        <article className="stat-card warning">
          <span>Stock bajo</span>
          <strong>0</strong>
          <small>Productos críticos</small>
        </article>

        <article className="stat-card">
          <span>Estado de caja</span>
          <strong>Cerrada</strong>
          <small>Abrí caja para vender</small>
        </article>
      </div>

      <div className="panel">
        <h3>Próximo paso</h3>
        <p>
          En el Sprint 2 conectamos SQLite y hacemos que productos, ventas y caja
          guarden información real en la computadora.
        </p>
      </div>
    </div>
  )
}
