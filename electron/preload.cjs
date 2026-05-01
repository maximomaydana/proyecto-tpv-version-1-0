const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tpv', {
  appName: 'TPV Modular Desktop',
  version: '0.1.0',

  dashboard: {
  getStats: () => ipcRenderer.invoke('dashboard:getStats')
  },

  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    create: (product) => ipcRenderer.invoke('products:create', product),
    update: (product) => ipcRenderer.invoke('products:update', product),
    deactivate: (productId) => ipcRenderer.invoke('products:deactivate', productId)
  },

  sales: {
    create: (sale) => ipcRenderer.invoke('sales:create', sale),
    getAll: () => ipcRenderer.invoke('sales:getAll')
  },

  cash: {
    getSummary: () => ipcRenderer.invoke('cash:getSummary'),
    open: (openingAmount) => ipcRenderer.invoke('cash:open', openingAmount),
    close: (closingAmount) => ipcRenderer.invoke('cash:close', closingAmount),
    createMovement: (movement) => ipcRenderer.invoke('cash:createMovement', movement)
  }
})