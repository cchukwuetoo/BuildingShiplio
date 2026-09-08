import { useState } from 'react'
import { Menu, LayoutDashboard, Package, PackagePlus, Route, Settings } from 'lucide-react'
import Sidebar, { CustomerView } from '../components/CustomerSidebar.js'
import Overview from './customer/Overview.js'
import BookShipment from './customer/BookShipment.js'
import MyShipments from './customer/MyShipments.js'
import TrackShipment from './customer/TrackShipment.js'
import PickupCode from './customer/PickupCode.js'
import SettingsPage from './customer/Settings.js'
import Support from './customer/Support.js'
import { AuthUser } from '../types.js'
import '../styles/customer.css'

interface CustomerDashboardProps {
  user: AuthUser | null
  onLogout: () => void
}

const VIEW_TITLES: Record<CustomerView, string> = {
  overview: 'Overview',
  book: 'Book a shipment',
  shipments: 'My shipments',
  track: 'Track package',
  pickup: 'Pickup code',
  settings: 'Settings',
  support: 'Help & support',
}

const BOTTOM_NAV = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'shipments' as const, label: 'Shipments', icon: Package },
  { id: 'book' as const, label: 'Book', icon: PackagePlus },
  { id: 'track' as const, label: 'Track', icon: Route },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export default function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  const [view, setView] = useState<CustomerView>('overview')
  const [trackId, setTrackId] = useState<string | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigate = (next: CustomerView, opts?: { shipmentId?: string }) => {
    setView(next)
    setTrackId(opts?.shipmentId)
    setDrawerOpen(false)
    window.scrollTo({ top: 0 })
  }

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <Overview user={user} onNavigate={navigate} />
      case 'book':
        return <BookShipment onNavigate={navigate} />
      case 'shipments':
        return <MyShipments onNavigate={navigate} />
      case 'track':
        return <TrackShipment key={trackId ?? 'manual'} initialShipmentId={trackId} />
      case 'pickup':
        return <PickupCode key={trackId ?? 'pick'} initialShipmentId={trackId} />
      case 'settings':
        return <SettingsPage user={user} onLogout={onLogout} />
      case 'support':
        return <Support />
    }
  }

  return (
    <div className="cust-dashboard">
      <aside className={`cust-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar
          active={view}
          onNavigate={navigate}
          user={user}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
      </aside>

      {drawerOpen && (
        <div
          className={`cust-backdrop ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div className={`cust-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <Sidebar
          active={view}
          onNavigate={navigate}
          user={user}
          onLogout={onLogout}
          onRequestClose={() => setDrawerOpen(false)}
        />
      </div>

      <div className="cust-main">
        <div className="cust-topbar">
          <div className="cust-topbar-left">
            <button
              className="cust-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="cust-topbar-title">{VIEW_TITLES[view]}</span>
          </div>
          <div className="cust-topbar-right">
            <div className="cust-topbar-chip">
              <span className="cust-avatar">{user?.fullName?.[0]?.toUpperCase() || 'S'}</span>
              <span>{user?.fullName || 'Customer'}</span>
            </div>
          </div>
        </div>

        <div className="cust-content">{renderView()}</div>

        <nav className="cust-bottom-nav" aria-label="Quick navigation">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon
            if (item.id === 'book') {
              return (
                <button
                  key={item.id}
                  className="cust-bottom-item book"
                  aria-label="Book a shipment"
                  onClick={() => navigate('book')}
                >
                  <span className="cust-bottom-book">
                    <PackagePlus size={22} />
                  </span>
                </button>
              )
            }
            return (
              <button
                key={item.id}
                className={`cust-bottom-item ${view === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}