import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function AppLayout({ business, activePage, onNavigate, onLogout, children }) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="main-content">
        <Topbar business={business} onLogout={onLogout} />
        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  )
}
