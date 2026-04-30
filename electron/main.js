import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  initDatabase,
  getProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  createSale,
  getSales,
  getCashSummary,
  openCashSession,
  closeCashSession,
  createCashMovement
} from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f6f7fb',
    title: 'TPV Modular Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function registerIpcHandlers() {
  ipcMain.handle('products:getAll', () => {
    return getProducts()
  })

  ipcMain.handle('products:create', (_event, product) => {
    return createProduct(product)
  })

  ipcMain.handle('products:update', (_event, product) => {
    return updateProduct(product)
  })

  ipcMain.handle('products:deactivate', (_event, productId) => {
    return deactivateProduct(productId)
  })

  ipcMain.handle('sales:create', (_event, sale) => {
    return createSale(sale)
  })

  ipcMain.handle('sales:getAll', () => {
    return getSales()
  })

  ipcMain.handle('cash:getSummary', () => {
    return getCashSummary()
  })

  ipcMain.handle('cash:open', (_event, openingAmount) => {
    return openCashSession(openingAmount)
  })

  ipcMain.handle('cash:close', (_event, closingAmount) => {
    return closeCashSession(closingAmount)
  })

  ipcMain.handle('cash:createMovement', (_event, movement) => {
    return createCashMovement(movement)
  })
}

app.whenReady().then(() => {
  initDatabase(app)
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})