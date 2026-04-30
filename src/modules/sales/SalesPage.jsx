import { useEffect, useMemo, useState } from 'react'

export default function SalesPage() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [discount, setDiscount] = useState('')

  async function loadData() {
    const productsData = await window.tpv.products.getAll()
    const salesData = await window.tpv.sales.getAll()

    setProducts(productsData)
    setSales(salesData)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) return products

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(value) ||
        String(product.barcode || '').toLowerCase().includes(value)
      )
    })
  }, [products, search])

  const subtotal = cart.reduce((acc, item) => {
    return acc + Number(item.sale_price) * Number(item.quantity)
  }, 0)

  const finalTotal = Math.max(subtotal - Number(discount || 0), 0)

  function addToCart(product) {
    if (product.stock <= 0) {
      alert('Este producto no tiene stock')
      return
    }

    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('No hay más stock disponible')
        return
      }

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )

      return
    }

    setCart([
      ...cart,
      {
        ...product,
        quantity: 1
      }
    ])
  }

  function increaseQuantity(productId) {
    setCart(
      cart.map((item) => {
        if (item.id !== productId) return item

        if (item.quantity >= item.stock) {
          alert('No hay más stock disponible')
          return item
        }

        return {
          ...item,
          quantity: item.quantity + 1
        }
      })
    )
  }

  function decreaseQuantity(productId) {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(productId) {
    setCart(cart.filter((item) => item.id !== productId))
  }

  async function confirmSale() {
    try {
      if (cart.length === 0) {
        alert('El carrito está vacío')
        return
      }

      if (!paymentMethod) {
        alert('Seleccioná un método de pago')
        return
      }

      const sale = {
        payment_method: paymentMethod,
        discount: Number(discount || 0),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      }

      await window.tpv.sales.create(sale)

      alert('Venta realizada correctamente')

      setCart([])
      setPaymentMethod('')
      setDiscount('')
      setSearch('')

      await loadData()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Error al realizar la venta')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Ventas</h2>
          <p>Venta rápida con productos reales y descuento automático de stock.</p>
        </div>
      </div>

      <div className="sales-layout">
        <section className="panel">
          <h3>Buscar producto</h3>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Escanear código o buscar por nombre..."
          />

          <div className="product-shortcuts">
            {filteredProducts.length === 0 ? (
              <p>No hay productos para mostrar.</p>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <strong>{product.name}</strong>
                  <span>${Number(product.sale_price).toLocaleString('es-AR')}</span>
                  <small>Stock: {product.stock}</small>
                </button>
              ))
            )}
          </div>
        </section>

        <aside className="panel cart-panel">
          <h3>Carrito</h3>

          {cart.length === 0 ? (
            <div className="empty-cart">
              Todavía no agregaste productos.
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      ${Number(item.sale_price).toLocaleString('es-AR')} c/u
                    </small>
                  </div>

                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)}>+</button>
                  </div>

                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label>
            Descuento
            <input
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              inputMode="numeric"
              placeholder="0"
            />
          </label>

          <div className="cart-total">
            <span>Subtotal</span>
            <strong>${subtotal.toLocaleString('es-AR')}</strong>
          </div>

          <div className="cart-total final">
            <span>Total</span>
            <strong>${finalTotal.toLocaleString('es-AR')}</strong>
          </div>

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="">Método de pago</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>

          <button
            className="btn btn-primary"
            disabled={cart.length === 0}
            onClick={confirmSale}
          >
            Cobrar
          </button>
        </aside>
      </div>

      <div className="panel sales-history">
        <h3>Últimas ventas</h3>

        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Productos</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="5">Todavía no hay ventas registradas.</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{new Date(sale.created_at).toLocaleString('es-AR')}</td>
                  <td>{sale.payment_method}</td>
                  <td>{sale.items_count}</td>
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