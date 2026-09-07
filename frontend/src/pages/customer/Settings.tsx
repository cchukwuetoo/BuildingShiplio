import { LogOut, ShieldCheck, Bell, UserRound } from 'lucide-react'
import { formatRole } from '../../lib/format.js'
import { AuthUser } from '../../types.js'

interface SettingsProps {
  user: AuthUser | null
  onLogout: () => void
}

export default function Settings({ user, onLogout }: SettingsProps) {
  return (
    <div>
      <div className="cust-hello">
        <h2>Settings</h2>
        <p>Your account and preferences.</p>
      </div>

      <div className="cust-card">
        <h3>
          <UserRound size={18} /> Profile
        </h3>
        <div className="cust-profile-row">
          <span className="cust-avatar">{user?.fullName?.[0]?.toUpperCase() || 'S'}</span>
          <div>
            <strong>{user?.fullName || 'Customer'}</strong>
            <p className="route-meta">{formatRole(user?.role ?? null)}</p>
          </div>
        </div>
        <div className="cust-info-grid">
          <div>
            <span>Full name</span>
            <strong>{user?.fullName || '—'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{formatRole(user?.role ?? null) || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="cust-card">
        <h3>
          <ShieldCheck size={18} /> Security
        </h3>
        <p className="route-meta" style={{ marginBottom: '0.9rem' }}>
          Passwords and account recovery are handled at sign-in.
        </p>
        <span className="cust-coming-soon">Password reset is coming soon</span>
      </div>

      <div className="cust-card">
        <h3>
          <Bell size={18} /> Notifications
        </h3>
        <p className="route-meta" style={{ marginBottom: '0.9rem' }}>
          We&apos;ll email you as your shipment moves through each stage.
        </p>
        <span className="cust-coming-soon">Notification controls are coming soon</span>
      </div>

      <div className="cust-card">
        <h3>Sign out</h3>
        <p className="route-meta" style={{ marginBottom: '0.9rem' }}>
          End your session on this device.
        </p>
        <button className="action-btn btn-danger" onClick={onLogout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )
}