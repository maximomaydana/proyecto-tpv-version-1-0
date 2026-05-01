import { useEffect, useMemo, useState } from 'react'

const initialForm = {
  name: '',
  barcode: '',
  category: '',
  purchase_price: '',
  sale_price: '',
  stock: '',
  min_stock: ''
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-AR')
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  async function loadProducts() {
    const data = await window.tpv.products.getAll()
    setProducts(data)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category)
      .filter(Boolean)

    return [...new Set(uniqueCategories)]
  }, [products])

  const filteredProducts = useMemo(() => {
    const searchValue = normalizeText(search)

    return products.filter((product) => {
      const matchesSearch =
        normalizeText(product.name).includes(searchValue) ||
        normalizeText(product.barcode).includes(searchValue) ||
        normalizeText(product.category).includes(searchValue)

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  function handleChange(event) {
    const { name, value } = event.target

    const numericFields = ['purchase_price', 'sale_price', 'stock', 'min_stock']

    setForm({
      ...form,
      [name]: numericFields.includes(name)
        ? value.replace(/[^0-9]/g, '')
        : value
    })
  }

  function openCreateForm() {
    setForm(initialForm)
    setEditingProductId(null)
    setShowForm(true)
  }

  function openEditForm(product) {
    setForm({
      name: product.name || '',
      barcode: product.barcode || '',
      category: product.category || '',
      purchase_price: String(product.purchase_price || ''),
      sale_price: String(product.sale_price || ''),
      stock: String(product.stock || ''),
      min_stock: String(product.min_stock || '')
    })

    setEditingProductId(product.id)
    setShowForm(true)
  }

  function closeForm() {
    setForm(initialForm)
    setEditingProductId(null)
    setShowForm(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      alert('El nombre del producto es obligatorio')
      return
    }

    if (!form.sale_price || Number(form.sale_price) <= 0) {
      alert('El precio de venta es obligatorio y debe ser mayor a 0')
      return
    }

    try {
      if (editingProductId) {
        await window.tpv.products.update({
          id: editingProductId,
          ...form
        })
      } else {
        await window.tpv.products.create(form)
      }

      closeForm()
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error al guardar el producto')
    }
  }

  async function handleDeactivate(product) {
    const confirmed = confirm(
      `¿Seguro que querés desactivar "${product.name}"?\n\nNo se va a borrar de la base, pero dejará de aparecer en productos y ventas.`
    )

    if (!confirmed) return

    try {
      await window.tpv.products.deactivate(product.id)
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error al desactivar el producto')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Productos</h2>
          <p>Administrá productos, precios, categorías y stock.</p>
        </div>

        <button className="btn btn-primary" onClick={openCreateForm}>
          Nuevo producto
        </button>
      </div>

      {showForm && (
        <div className="panel product-form">
          <h3>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h3>

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
              <button type="button" className="btn btn-secondary" onClick={closeForm}>
                Cancelar
              </button>

              <button type="submit" className="btn btn-primary">
                {editingProductId ? 'Guardar cambios' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="table-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, código o categoría..."
          />

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7">Todavía no hay productos para mostrar.</td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const stock = Number(product.stock || 0)
                const minStock = Number(product.min_stock || 0)
                const hasLowStock = minStock > 0 && stock <= minStock

                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.barcode || '-'}</td>
                    <td>{product.category || '-'}</td>
                    <td>${formatCurrency(product.purchase_price)}</td>
                    <td>${formatCurrency(product.sale_price)}</td>
                    <td>
                      {stock}
                      {hasLowStock && (
                        <small style={{ display: 'block' }}>
                          Stock bajo
                        </small>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openEditForm(product)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeactivate(product)}
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}