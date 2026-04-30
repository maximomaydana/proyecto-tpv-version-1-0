import { useState } from 'react'

export default function InitialSetupPage({ onFinish }) {
  const [businessName, setBusinessName] = useState('')
  const [adminName, setAdminName] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onFinish()
  }

  return (
    <div className="auth-screen">
      <form className="auth-card setup-card" onSubmit={handleSubmit}>
        <div className="auth-logo">TPV</div>
        <h1>Configuración inicial</h1>
        <p>Creá el comercio y activá el modo kiosco/minimercado para empezar.</p>

        <label>
          Nombre del comercio
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Ej: Kiosco Avenida"
          />
        </label>

        <label>
          Usuario administrador
          <input
            value={adminName}
            onChange={(event) => setAdminName(event.target.value)}
            placeholder="Ej: Admin"
          />
        </label>

        <label>
          Tipo de negocio
          <select defaultValue="kiosco">
            <option value="kiosco">Kiosco / Minimercado</option>
            <option value="restaurante" disabled>Restaurante / Bar próximamente</option>
            <option value="indumentaria" disabled>Indumentaria próximamente</option>
            <option value="servicios" disabled>Servicios próximamente</option>
          </select>
        </label>

        <button className="btn btn-primary" type="submit">
          Crear sistema
        </button>
      </form>
    </div>
  )
}
