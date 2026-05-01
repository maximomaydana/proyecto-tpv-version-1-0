import { useEffect, useState } from 'react'

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null)

  async function loadStats() {
    const data = await window.tpv.dashboard.getStats()
    setStats(data)
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (!stats) {
    return (
      <div className="page">
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
  <div>
    <h2>Dashboard</h2>
    <p>Resumen real del negocio.</p>
  </div>

  <div className="dashboard-actions">
    <span className={`cash-status ${stats.cash_is_open ? 'open' : 'closed'}`}>
      {stats.cash_is_open ? 'Caja abierta' : 'Caja cerrada'}
    </span>

    {!stats.cash_is_open && (
      <button className="btn btn-primary" onClick={() => onNavigate('cash')}>
        Abrir caja
      </button>
    )}
  </div>
</div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Ventas de hoy</span>
          <strong>${Number(stats.total_sales).toLocaleString('es-AR')}</strong>
          <small>Total vendido durante el día</small>
        </article>

        <article className="stat-card">
          <span>Cantidad de ventas</span>
          <strong>{stats.sales_count}</strong>
          <small>Operaciones registradas hoy</small>
        </article>

        <article className="stat-card warning">
          <span>Stock bajo</span>
          <strong>{stats.low_stock_count}</strong>
          <small>Productos que necesitan reposición</small>
        </article>

        <article className="stat-card">
          <span>Estado de caja</span>
          <strong>{stats.cash_is_open ? 'Abierta' : 'Cerrada'}</strong>
          <small>
            {stats.cash_is_open
              ? 'Ya podés vender normalmente'
              : 'Abrí caja antes de vender'}
          </small>
        </article>
      </div>

      <div className="panel">
        <h3>Últimas ventas</h3>

        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {stats.latest_sales.length === 0 ? (
              <tr>
                <td colSpan="4">Todavía no hay ventas registradas.</td>
              </tr>
            ) : (
              stats.latest_sales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{new Date(sale.created_at).toLocaleString('es-AR')}</td>
                  <td>{sale.payment_method}</td>
                  <td>${Number(sale.total).toLocaleString('es-AR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}