import { useEffect, useState } from 'react'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-AR')
}

function onlyNumbers(value) {
  return value.replace(/[^0-9]/g, '')
}

export default function CashPage() {
  const [summary, setSummary] = useState(null)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [movementType, setMovementType] = useState('ingreso')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadSummary() {
    const data = await window.tpv.cash.getSummary()
    setSummary(data)
  }

  function showMessage(text) {
    setError('')
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 3000)
  }

  function showError(text) {
    setMessage('')
    setError(text)

    setTimeout(() => {
      setError('')
    }, 4000)
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
      showMessage('Caja abierta correctamente')
    } catch (error) {
      showError(error.message || 'Error al abrir caja')
    }
  }

  async function handleCloseCash(event) {
    event.preventDefault()

    try {
      await window.tpv.cash.close(Number(closingAmount || 0))
      setClosingAmount('')
      await loadSummary()
      showMessage('Caja cerrada correctamente')
    } catch (error) {
      showError(error.message || 'Error al cerrar caja')
    }
  }

  async function handleCreateMovement(event) {
    event.preventDefault()

    try {
      if (!movementAmount) {
        showError('Ingresá un monto')
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

      showMessage('Movimiento registrado correctamente')
    } catch (error) {
      showError(error.message || 'Error al registrar movimiento')
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
  const closingDifference = Number(closingAmount || 0) - Number(totals.expected_amount || 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Caja</h2>
          <p>Apertura, movimientos, ventas por método de pago y cierre de caja.</p>
        </div>

        <span className={`cash-status ${summary.isOpen ? 'open' : 'closed'}`}>
          {summary.isOpen ? 'Caja abierta' : 'Caja cerrada'}
        </span>
      </div>

      {message && (
        <div className="app-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="app-message error">
          {error}
        </div>
      )}

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
                onChange={(event) => setOpeningAmount(onlyNumbers(event.target.value))}
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
              <strong>${formatCurrency(totals.opening_amount)}</strong>
            </article>

            <article className="stat-card">
              <span>Ventas en efectivo</span>
              <strong>${formatCurrency(totals.efectivo)}</strong>
            </article>

            <article className="stat-card">
              <span>Transferencias</span>
              <strong>${formatCurrency(totals.transferencia)}</strong>
            </article>

            <article className="stat-card">
              <span>Tarjeta</span>
              <strong>${formatCurrency(totals.tarjeta)}</strong>
            </article>

            <article className="stat-card">
              <span>Mercado Pago</span>
              <strong>${formatCurrency(totals.mercado_pago)}</strong>
            </article>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span>Ingresos manuales</span>
              <strong>${formatCurrency(totals.ingresos)}</strong>
            </article>

            <article className="stat-card">
              <span>Egresos manuales</span>
              <strong>${formatCurrency(totals.egresos)}</strong>
            </article>

            <article className="stat-card">
              <span>Ventas totales</span>
              <strong>${formatCurrency(totals.total_sales)}</strong>
            </article>

            <article className="stat-card">
              <span>Efectivo esperado</span>
              <strong>${formatCurrency(totals.expected_amount)}</strong>
            </article>
          </div>

          <div className="panel">
            <h3>Resumen de caja actual</h3>

            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Detalle</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Ventas totales</td>
                  <td>${formatCurrency(totals.total_sales)}</td>
                  <td>Suma de efectivo, transferencia, tarjeta y Mercado Pago.</td>
                </tr>

                <tr>
                  <td>Efectivo esperado</td>
                  <td>${formatCurrency(totals.expected_amount)}</td>
                  <td>Monto inicial + ventas en efectivo + ingresos - egresos.</td>
                </tr>

                <tr>
                  <td>Ventas no efectivo</td>
                  <td>
                    ${formatCurrency(
                      Number(totals.transferencia || 0) +
                      Number(totals.tarjeta || 0) +
                      Number(totals.mercado_pago || 0)
                    )}
                  </td>
                  <td>Transferencia, tarjeta y Mercado Pago no suman al efectivo esperado.</td>
                </tr>
              </tbody>
            </table>
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
                    onChange={(event) => setMovementAmount(onlyNumbers(event.target.value))}
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
                    onChange={(event) => setClosingAmount(onlyNumbers(event.target.value))}
                    placeholder="0"
                  />
                </label>

                <div className="cash-expected-box">
                  <span>Efectivo esperado</span>
                  <strong>${formatCurrency(totals.expected_amount)}</strong>
                </div>

                {closingAmount && (
                  <div className="cash-expected-box">
                    <span>Diferencia estimada</span>
                    <strong>${formatCurrency(closingDifference)}</strong>
                  </div>
                )}

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