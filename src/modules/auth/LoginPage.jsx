import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onLogin()
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">TPV</div>
        <h1>Iniciar sesión</h1>
        <p>Entrá al sistema para comenzar a vender.</p>

        <label>
          Usuario
          <input
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="admin"
          />
        </label>

        <label>
          Contraseña
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Ingresar
        </button>

        <small>Demo visual: podés ingresar con cualquier dato.</small>
      </form>
    </div>
  )
}
