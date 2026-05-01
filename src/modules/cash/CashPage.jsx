import { useEffect, useState } from 'react'

export default function CashPage() {
  const [summary, setSummary] = useState(null)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [movementType, setMovementType] = useState('ingreso')

  async function loadSummary() {
    const data = await window.tpv.cash.getSummary()
    setSummary(data)
  }

  useEffect(() => {
    loadSummary()
  }, [])

  async function handleOpenCash(event) {
    event.preventDefault()

    try {
      await window.tpv.cash.open(Number(openingAmount || 0))
      setOpeningAmount('')
      await loadSummary()
      window.dispatchEvent(new Event('cash-updated'))
      showMessage('Caja abierta correctamente')
    } catch (error) {
      alert(error.message || 'Error al abrir caja')
    }
  }

  async function handleCloseCash(event) {
    event.preventDefault()

    try {
      await window.tpv.cash.close(Number(closingAmount || 0))
      setClosingAmount('')
      await loadSummary()
      window.dispatchEvent(new Event('cash-updated'))
      showMessage('Caja cerrada correctamente')
    } catch (error) {
      alert(error.message || 'Error al cerrar caja')
    }
  }

  async function handleCreateMovement(event) {
    event.preventDefault()

    try {
      if (!movementAmount) {
        alert('Ingresá un monto')
        return
      }

      await window.tpv.cash.createMovement({
        type: movementType,
        amount: Number(movementAmount || 0),
        description: movementDescription
      })

      setMovementAmount('')
      setMovementDescription('')
      setMovementType('ingreso')

      await loadSummary()
      window.dispatchEvent(new Event('cash-updated'))

      showMessage('Movimiento registrado correctamente')
    } catch (error) {
      alert(error.message || 'Error al registrar movimiento')
    }
  }

  if (!summary) {
    return (
      <div className="page">
        <p>Cargando caja...</p>
      </div>
    )
  }

  const totals = summary.totals

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Caja</h2>
          <p>Apertura, movimientos y cierre de caja.</p>
        </div>

        <span className={`cash-status ${summary.isOpen ? 'open' : 'closed'}`}>
          {summary.isOpen ? 'Caja abierta' : 'Caja cerrada'}
        </span>
      </div>

      {!summary.isOpen ? (
        <div className="panel cash-form-panel">
          <h3>Abrir caja</h3>
          <p>Ingresá el dinero inicial que hay en efectivo.</p>

          <form onSubmit={handleOpenCash} className="cash-inline-form">
            <label>
              Monto inicial
              <input
                inputMode="numeric"
                value={openingAmount}
                onChange={(event) => setOpeningAmount(event.target.value)}
                placeholder="0"
              />
            </label>

            <button className="btn btn-primary" type="submit">
              Abrir caja
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Monto inicial</span>
              <strong>${totals.opening_amount.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Ventas efectivo</span>
              <strong>${totals.efectivo.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Transferencias</span>
              <strong>${totals.transferencia.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Tarjeta</span>
              <strong>${totals.tarjeta.toLocaleString('es-AR')}</strong>
            </article>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span>Ingresos manuales</span>
              <strong>${totals.ingresos.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Egresos manuales</span>
              <strong>${totals.egresos.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Ventas totales</span>
              <strong>${totals.total_sales.toLocaleString('es-AR')}</strong>
            </article>

            <article className="stat-card">
              <span>Efectivo esperado</span>
              <strong>${totals.expected_amount.toLocaleString('es-AR')}</strong>
            </article>
          </div>

          <div className="cash-grid">
            <div className="panel">
              <h3>Movimiento manual</h3>
              <p>Usalo para registrar ingresos o egresos de efectivo.</p>

              <form onSubmit={handleCreateMovement} className="cash-form">
                <label>
                  Tipo
                  <select
                    value={movementType}
                    onChange={(event) => setMovementType(event.target.value)}
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </label>

                <label>
                  Monto
                  <input
                    inputMode="numeric"
                    value={movementAmount}
                    onChange={(event) => setMovementAmount(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Descripción
                  <input
                    value={movementDescription}
                    onChange={(event) => setMovementDescription(event.target.value)}
                    placeholder="Ej: retiro de efectivo"
                  />
                </label>

                <button className="btn btn-secondary" type="submit">
                  Registrar movimiento
                </button>
              </form>
            </div>

            <div className="panel">
              <h3>Cerrar caja</h3>
              <p>
                Ingresá el efectivo real contado. El sistema calculará la diferencia.
              </p>

              <form onSubmit={handleCloseCash} className="cash-form">
                <label>
                  Efectivo real contado
                  <input
                    inputMode="numeric"
                    value={closingAmount}
                    onChange={(event) => setClosingAmount(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <div className="cash-expected-box">
                  <span>Efectivo esperado</span>
                  <strong>${totals.expected_amount.toLocaleString('es-AR')}</strong>
                </div>

                <button className="btn btn-primary" type="submit">
                  Cerrar caja
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}