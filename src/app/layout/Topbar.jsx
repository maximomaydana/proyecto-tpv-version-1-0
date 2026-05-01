import { useEffect, useState } from 'react'

export default function Topbar({ business, activePage, onLogout }) {
  const [cashIsOpen, setCashIsOpen] = useState(false)

  async function loadCashStatus() {
    try {
      const summary = await window.tpv.cash.getSummary()
      setCashIsOpen(summary.isOpen)
    } catch (error) {
      console.error('Error al cargar estado de caja:', error)
      setCashIsOpen(false)
    }
  }

  useEffect(() => {
    loadCashStatus()

    window.addEventListener('cash-updated', loadCashStatus)

    return () => {
      window.removeEventListener('cash-updated', loadCashStatus)
    }
  }, [activePage])

  return (
    <header className="topbar">
      <div>
        <h1>{business.name}</h1>
        <p>Modo activo: {business.type}</p>
      </div>

      <div className="topbar-actions">
        <span className={`topbar-cash-pill ${cashIsOpen ? 'open' : 'closed'}`}>
          {cashIsOpen ? 'Caja abierta' : 'Caja cerrada'}
        </span>

        <button className="btn btn-secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
    }