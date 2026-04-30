export default function SettingsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Datos del comercio, rubro activo y preferencias.</p>
        </div>
      </div>

      <div className="panel form-panel">
        <label>
          Nombre del comercio
          <input defaultValue="Mi Comercio" />
        </label>

        <label>
          Tipo de negocio
          <select defaultValue="kiosco">
            <option value="kiosco">Kiosco / Minimercado</option>
            <option value="restaurante">Restaurante / Bar próximamente</option>
          </select>
        </label>

        <button className="btn btn-primary">Guardar cambios</button>
      </div>
    </div>
  )
}
