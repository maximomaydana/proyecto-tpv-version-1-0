import Database from 'better-sqlite3'
import path from 'node:path'

let db = null

function ensureColumn(tableName, columnName, columnDefinition) {
  const columns = db.pragma(`table_info(${tableName})`)
  const exists = columns.some((column) => column.name === columnName)

  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`)
  }
}

export function initDatabase(app) {
  const dbPath = path.join(app.getPath('userData'), 'tpv-modular.sqlite')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT,
      category TEXT,
      purchase_price REAL DEFAULT 0,
      sale_price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cash_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opening_amount REAL NOT NULL DEFAULT 0,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      status TEXT NOT NULL DEFAULT 'open',
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_session_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_session_id INTEGER,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      discount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `)

  ensureColumn('sales', 'cash_session_id', 'INTEGER')

  return db
}

export function getProducts() {
  return db.prepare(`
    SELECT *
    FROM products
    WHERE active = 1
    ORDER BY id DESC
  `).all()
}

export function createProduct(product) {
  const stmt = db.prepare(`
    INSERT INTO products (
      name,
      barcode,
      category,
      purchase_price,
      sale_price,
      stock,
      min_stock
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    product.name,
    product.barcode || '',
    product.category || '',
    Number(product.purchase_price || 0),
    Number(product.sale_price || 0),
    Number(product.stock || 0),
    Number(product.min_stock || 0)
  )

  return {
    id: result.lastInsertRowid,
    ...product
  }
}

export function getOpenCashSession() {
  return db.prepare(`
    SELECT *
    FROM cash_sessions
    WHERE status = 'open'
    ORDER BY id DESC
    LIMIT 1
  `).get()
}

export function openCashSession(openingAmount) {
  const openSession = getOpenCashSession()

  if (openSession) {
    throw new Error('Ya hay una caja abierta')
  }

  db.prepare(`
    INSERT INTO cash_sessions (opening_amount, status)
    VALUES (?, 'open')
  `).run(Number(openingAmount || 0))

  return getOpenCashSession()
}

export function getCashSummary() {
  const session = getOpenCashSession()

  if (!session) {
    return {
      isOpen: false,
      session: null,
      totals: {
        opening_amount: 0,
        efectivo: 0,
        transferencia: 0,
        tarjeta: 0,
        total_sales: 0,
        ingresos: 0,
        egresos: 0,
        expected_amount: 0
      }
    }
  }

  const paymentRows = db.prepare(`
    SELECT payment_method, SUM(total) AS total
    FROM sales
    WHERE cash_session_id = ?
    GROUP BY payment_method
  `).all(session.id)

  const totalsByPayment = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0
  }

  for (const row of paymentRows) {
    totalsByPayment[row.payment_method] = Number(row.total || 0)
  }

  const incomes = db.prepare(`
    SELECT SUM(amount) AS total
    FROM cash_movements
    WHERE cash_session_id = ? AND type = 'ingreso'
  `).get(session.id)

  const expenses = db.prepare(`
    SELECT SUM(amount) AS total
    FROM cash_movements
    WHERE cash_session_id = ? AND type = 'egreso'
  `).get(session.id)

  const ingresos = Number(incomes.total || 0)
  const egresos = Number(expenses.total || 0)

  const expectedAmount =
    Number(session.opening_amount || 0) +
    Number(totalsByPayment.efectivo || 0) +
    ingresos -
    egresos

  return {
    isOpen: true,
    session,
    totals: {
      opening_amount: Number(session.opening_amount || 0),
      efectivo: Number(totalsByPayment.efectivo || 0),
      transferencia: Number(totalsByPayment.transferencia || 0),
      tarjeta: Number(totalsByPayment.tarjeta || 0),
      total_sales:
        Number(totalsByPayment.efectivo || 0) +
        Number(totalsByPayment.transferencia || 0) +
        Number(totalsByPayment.tarjeta || 0),
      ingresos,
      egresos,
      expected_amount: expectedAmount
    }
  }
}

export function closeCashSession(closingAmount) {
  const session = getOpenCashSession()

  if (!session) {
    throw new Error('No hay una caja abierta para cerrar')
  }

  const summary = getCashSummary()
  const expectedAmount = Number(summary.totals.expected_amount || 0)
  const realAmount = Number(closingAmount || 0)
  const difference = realAmount - expectedAmount

  db.prepare(`
    UPDATE cash_sessions
    SET
      closing_amount = ?,
      expected_amount = ?,
      difference = ?,
      status = 'closed',
      closed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(realAmount, expectedAmount, difference, session.id)

  return {
    id: session.id,
    closing_amount: realAmount,
    expected_amount: expectedAmount,
    difference
  }
}

export function createCashMovement(movement) {
  const session = getOpenCashSession()

  if (!session) {
    throw new Error('Tenés que abrir caja primero')
  }

  const type = movement.type

  if (!['ingreso', 'egreso'].includes(type)) {
    throw new Error('Tipo de movimiento inválido')
  }

  db.prepare(`
    INSERT INTO cash_movements (
      cash_session_id,
      type,
      amount,
      description
    )
    VALUES (?, ?, ?, ?)
  `).run(
    session.id,
    type,
    Number(movement.amount || 0),
    movement.description || ''
  )

  return getCashSummary()
}

export function createSale(sale) {
  const createSaleTransaction = db.transaction(() => {
    const openCashSession = getOpenCashSession()

    if (!openCashSession) {
      throw new Error('Tenés que abrir caja antes de vender')
    }

    if (!sale.items || sale.items.length === 0) {
      throw new Error('El carrito está vacío')
    }

    if (!sale.payment_method) {
      throw new Error('Seleccioná un método de pago')
    }

    let total = 0

    for (const item of sale.items) {
      const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ? AND active = 1
      `).get(item.product_id)

      if (!product) {
        throw new Error('Producto no encontrado')
      }

      if (product.stock < item.quantity) {
        throw new Error(`No hay stock suficiente de ${product.name}`)
      }

      total += Number(product.sale_price) * Number(item.quantity)
    }

    const discount = Number(sale.discount || 0)
    const finalTotal = Math.max(total - discount, 0)

    const saleResult = db.prepare(`
      INSERT INTO sales (
        cash_session_id,
        total,
        payment_method,
        discount
      )
      VALUES (?, ?, ?, ?)
    `).run(
      openCashSession.id,
      finalTotal,
      sale.payment_method,
      discount
    )

    const saleId = saleResult.lastInsertRowid

    for (const item of sale.items) {
      const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `).get(item.product_id)

      const quantity = Number(item.quantity)
      const unitPrice = Number(product.sale_price)
      const subtotal = unitPrice * quantity

      db.prepare(`
        INSERT INTO sale_items (
          sale_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        saleId,
        product.id,
        product.name,
        quantity,
        unitPrice,
        subtotal
      )

      db.prepare(`
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
      `).run(quantity, product.id)
    }

    return {
      id: saleId,
      cash_session_id: openCashSession.id,
      total: finalTotal,
      payment_method: sale.payment_method,
      discount
    }
  })

  return createSaleTransaction()
}

export function getSales() {
  return db.prepare(`
    SELECT
      sales.id,
      sales.cash_session_id,
      sales.total,
      sales.payment_method,
      sales.discount,
      sales.created_at,
      COUNT(sale_items.id) AS items_count
    FROM sales
    LEFT JOIN sale_items ON sale_items.sale_id = sales.id
    GROUP BY sales.id
    ORDER BY sales.id DESC
    LIMIT 20
  `).all()
}

export function getDashboardStats() {
  const todaySales = db.prepare(`
    SELECT
      COUNT(*) AS sales_count,
      COALESCE(SUM(total), 0) AS total_sales
    FROM sales
    WHERE DATE(created_at) = DATE('now', 'localtime')
  `).get()

  const lowStock = db.prepare(`
    SELECT COUNT(*) AS count
    FROM products
    WHERE active = 1
    AND stock <= min_stock
  `).get()

  const latestSales = db.prepare(`
    SELECT
      id,
      total,
      payment_method,
      created_at
    FROM sales
    ORDER BY id DESC
    LIMIT 5
  `).all()

  const openCash = getOpenCashSession()

  return {
    sales_count: Number(todaySales.sales_count || 0),
    total_sales: Number(todaySales.total_sales || 0),
    low_stock_count: Number(lowStock.count || 0),
    cash_is_open: Boolean(openCash),
    latest_sales: latestSales
  }
}