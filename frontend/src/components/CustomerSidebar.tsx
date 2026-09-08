import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Route,
  KeyRound,
  Settings,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { AuthUser } from '../types.js'

export const CUSTOMER_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'book', label: 'Book a shipment', icon: PackagePlus },
  { id: 'shipments', label: 'My shipments', icon: Package },
  { id: 'track', label: 'Track package', icon: Route },
  { id: 'pickup', label: 'Pickup code', icon: KeyRound },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Help & support', icon: LifeBuoy },
] as const

export type CustomerView = (typeof CUSTOMER_NAV)[number]['id']

interface SidebarProps {
  active: CustomerView
  onNavigate: (view: CustomerView) => void
  user: AuthUser | null
  onLogout: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onRequestClose?: () => void
}

export default function Sidebar({
  active,
  onNavigate,
  user,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  onRequestClose,
}: SidebarProps) {
  return (
    <>
      <div className="cust-brand">
        <div className="brand-mark">S</div>
        {!collapsed && (
          <div className="cust-brand-text">
            <strong>Shiplio</strong>
            <span>Customer console</span>
          </div>
        )}
        <div className="cust-brand-actions">
          {onToggleCollapse && (
            <button
              className="cust-collapse-btn"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
          {onRequestClose && (
            <button
              className="cust-close-btn"
              onClick={onRequestClose}
              title="Close menu"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="cust-nav" aria-label="Customer navigation">
        <p className="cust-nav-label">Workspace</p>
        {CUSTOMER_NAV.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`cust-nav-item ${active === item.id ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                onNavigate(item.id)
                onRequestClose?.()
              }}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="cust-sidebar-user">
        <div className="cust-user-card">
          <span className="cust-avatar">{user?.fullName?.[0]?.toUpperCase() || 'S'}</span>
          {!collapsed && (
            <div className="cust-user-meta">
              <strong>{user?.fullName || 'Customer'}</strong>
              <span>{user?.email}</span>
            </div>
          )}
          <button className="cust-signout" onClick={onLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  )
}