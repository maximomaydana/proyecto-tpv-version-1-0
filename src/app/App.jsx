import { useState } from 'react'
import AppLayout from './layout/AppLayout.jsx'
import LoginPage from '../modules/auth/LoginPage.jsx'
import InitialSetupPage from '../modules/initialSetup/InitialSetupPage.jsx'
import DashboardPage from '../modules/dashboard/DashboardPage.jsx'
import ProductsPage from '../modules/products/ProductsPage.jsx'
import SalesPage from '../modules/sales/SalesPage.jsx'
import CashPage from '../modules/cash/CashPage.jsx'
import ReportsPage from '../modules/reports/ReportsPage.jsx'
import SettingsPage from '../modules/settings/SettingsPage.jsx'

const businessMock = {
  name: 'Mi Comercio',
  type: 'Kiosco / Minimercado'
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  if (!isConfigured) {
    return <InitialSetupPage onFinish={() => setIsConfigured(true)} />
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  const pages = {
    dashboard: <DashboardPage onNavigate={setActivePage} />,
    products: <ProductsPage />,
    sales: <SalesPage />,
    cash: <CashPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />
  }

  return (
    <AppLayout
      business={businessMock}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={() => setIsLoggedIn(false)}
    >
      {pages[activePage] ?? <DashboardPage />}
    </AppLayout>
  )
}
