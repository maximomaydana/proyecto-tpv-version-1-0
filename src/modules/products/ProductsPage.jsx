import { useEffect, useState } from 'react'

const initialForm = {
  name: '',
  barcode: '',
  category: '',
  purchase_price: '',
  sale_price: '',
  stock: '',
  min_stock: ''
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)

  async function loadProducts() {
    const data = await window.tpv.products.getAll()
    setProducts(data)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      alert('El nombre del producto es obligatorio')
      return
    }

    if (!form.sale_price) {
      alert('El precio de venta es obligatorio')
      return
    }

    await window.tpv.products.create(form)

    setForm(initialForm)
    setShowForm(false)
    loadProducts()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Productos</h2>
          <p>Productos guardados en SQLite dentro de la computadora.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Nuevo producto
        </button>
      </div>

      {showForm && (
        <div className="panel product-form">
          <h3>Nuevo producto</h3>

          <form onSubmit={handleSubmit} className="grid-form">
            <label>
              Nombre
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Coca Cola 500ml"
              />
            </label>

            <label>
              Código de barras
              <input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </label>

            <label>
              Categoría
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ej: Bebidas"
              />
            </label>

            <label>
              Precio de compra
              <input
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label>
              Precio de venta
              <input
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label>
              Stock
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label>
              Stock mínimo
              <input
                name="min_stock"
                value={form.min_stock}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>

              <button type="submit" className="btn btn-primary">
                Guardar producto
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="table-toolbar">
          <input placeholder="Buscar producto..." />
          <select>
            <option>Todas las categorías</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6">Todavía no cargaste productos.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.barcode || '-'}</td>
                  <td>{product.category || '-'}</td>
                  <td>${Number(product.purchase_price).toLocaleString('es-AR')}</td>
                  <td>${Number(product.sale_price).toLocaleString('es-AR')}</td>
                  <td>{product.stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}