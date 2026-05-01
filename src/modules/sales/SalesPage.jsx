import { useEffect, useMemo, useState } from 'react'

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercado_pago', label: 'Mercado Pago' }
]

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-AR')
}

function getPaymentMethodLabel(value) {
  const paymentMethod = PAYMENT_METHODS.find((method) => method.value === value)
  return paymentMethod ? paymentMethod.label : value || '-'
}

export default function SalesPage() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [discount, setDiscount] = useState('')
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null)

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

  const discountValue = Math.max(Number(discount || 0), 0)
  const finalTotal = Math.max(subtotal - discountValue, 0)

  function handleDiscountChange(event) {
    const value = event.target.value.replace(/[^0-9]/g, '')
    setDiscount(value)
  }

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

      const soldItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: Number(item.sale_price),
        subtotal: Number(item.sale_price) * Number(item.quantity)
      }))

      const sale = {
        payment_method: paymentMethod,
        discount: discountValue,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      }

      const createdSale = await window.tpv.sales.create(sale)

      setLastSaleReceipt({
        id: createdSale.id,
        created_at: new Date().toISOString(),
        payment_method: paymentMethod,
        subtotal,
        discount: discountValue,
        total: createdSale.total ?? finalTotal,
        items: soldItems
      })

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

      {lastSaleReceipt && (
        <div className="panel">
          <div className="page-header">
            <div>
              <h3>Venta realizada correctamente</h3>
              <p>
                Ticket #{lastSaleReceipt.id} -{' '}
                {new Date(lastSaleReceipt.created_at).toLocaleString('es-AR')}
              </p>
            </div>

            <button
              className="btn"
              onClick={() => setLastSaleReceipt(null)}
            >
              Cerrar ticket
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {lastSaleReceipt.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-total">
            <span>Método de pago</span>
            <strong>{getPaymentMethodLabel(lastSaleReceipt.payment_method)}</strong>
          </div>

          <div className="cart-total">
            <span>Subtotal</span>
            <strong>${formatCurrency(lastSaleReceipt.subtotal)}</strong>
          </div>

          <div className="cart-total">
            <span>Descuento</span>
            <strong>${formatCurrency(lastSaleReceipt.discount)}</strong>
          </div>

          <div className="cart-total final">
            <span>Total cobrado</span>
            <strong>${formatCurrency(lastSaleReceipt.total)}</strong>
          </div>
        </div>
      )}

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
                  <span>${formatCurrency(product.sale_price)}</span>
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
                    <small>${formatCurrency(item.sale_price)} c/u</small>
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
              onChange={handleDiscountChange}
              inputMode="numeric"
              placeholder="0"
            />
          </label>

          <div className="cart-total">
            <span>Subtotal</span>
            <strong>${formatCurrency(subtotal)}</strong>
          </div>

          <div className="cart-total final">
            <span>Total</span>
            <strong>${formatCurrency(finalTotal)}</strong>
          </div>

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="">Método de pago</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            disabled={cart.length === 0 || !paymentMethod}
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
                  <td>{getPaymentMethodLabel(sale.payment_method)}</td>
                  <td>{sale.items_count}</td>
                  <td>${formatCurrency(sale.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}