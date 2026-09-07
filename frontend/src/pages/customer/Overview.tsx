import { useEffect, useState } from 'react'
import {
  PackagePlus,
  Route,
  Package,
  Truck,
  CheckCircle,
  CircleAlert,
} from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { formatStatus, formatShipmentId } from '../../lib/format.js'
import { Shipment } from '../../types.js'
import ShipmentCard, { EmptyState } from '../../components/ShipmentCard.js'
import { CustomerView } from '../../components/CustomerSidebar.js'

interface OverviewProps {
  user: { fullName?: string } | null
  onNavigate: (view: CustomerView, opts?: { shipmentId?: string }) => void
}

function statusGroup(status: string): 'active' | 'ready' | 'cancelled' {
  if (status === 'CANCELLED') return 'cancelled'
  if (status === 'READY_FOR_DISPATCH') return 'ready'
  return 'active'
}

export default function Overview({ user, onNavigate }: OverviewProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await shipmentsAPI.getAll()
      setShipments(response.data)
    } catch {
      setError('Could not load your shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const firstName = (user?.fullName || 'there').split(' ')[0]
  const total = shipments.length
  const active = shipments.filter((s) => statusGroup(s.status) === 'active').length
  const ready = shipments.filter((s) => statusGroup(s.status) === 'ready').length
  const cancelled = shipments.filter((s) => statusGroup(s.status) === 'cancelled').length

  const recent = [...shipments]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 4)

  return (
    <div>
      <div className="cust-hello">
        <h2>Welcome back, {firstName}.</h2>
        <p>Here is how your deliveries are looking.</p>
      </div>

      {error && <div className="message error">{error}</div>}

      <div className="cust-quick-actions">
        <button
          className="action-btn btn-primary"
          onClick={() => onNavigate('book')}
        >
          <PackagePlus size={17} /> Book a shipment
        </button>
        <button
          className="action-btn btn-secondary hide-mobile"
          onClick={() => onNavigate('track')}
        >
          <Route size={17} /> Track a package
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <Package size={15} />
          <span>Total shipments</span>
          <strong>{total}</strong>
        </div>
        <div className="stat-card">
          <Truck size={15} />
          <span>In transit</span>
          <strong>{active}</strong>
        </div>
        <div className="stat-card">
          <CheckCircle size={15} />
          <span>Ready for dispatch</span>
          <strong>{ready}</strong>
        </div>
        <div className="stat-card">
          <CircleAlert size={15} />
          <span>Cancelled</span>
          <strong>{cancelled}</strong>
        </div>
      </div>

      <div className="cust-section-title">
        <h3>Recent shipments</h3>
        <button className="link-btn" onClick={() => onNavigate('shipments')}>
          View all <span aria-hidden>→</span>
        </button>
      </div>

      {loading && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!loading && recent.length === 0 && (
        <EmptyState
          title="No shipments yet"
          body="Book a pickup and watch it move here in real time."
        />
      )}

      {recent.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          actions={
            <button
              className="action-btn btn-secondary"
              onClick={() => onNavigate('track', { shipmentId: shipment.id })}
            >
              <Route size={16} /> Track
            </button>
          }
        />
      ))}

      {!loading && recent.length > 0 && (
        <p className="shipment-kicker" style={{ marginTop: '0.6rem' }}>
          Latest shipment ID: {formatShipmentId(recent[0].id)} · {formatStatus(recent[0].status)}
        </p>
      )}
    </div>
  )
}