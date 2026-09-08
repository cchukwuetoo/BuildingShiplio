import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, Route, KeyRound } from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import ShipmentCard, { EmptyState } from '../../components/ShipmentCard.js'
import { Shipment } from '../../types.js'
import { CustomerView } from '../../components/CustomerSidebar.js'

interface MyShipmentsProps {
  onNavigate: (view: CustomerView, opts?: { shipmentId?: string }) => void
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'PICKUP_ASSIGNED', 'PICKED_UP', 'RECEIVED_AT_WAREHOUSE', 'PROCESSING', 'READY_FOR_DISPATCH', 'CANCELLED']

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function MyShipments({ onNavigate }: MyShipmentsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadShipments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await shipmentsAPI.getAll()
      setShipments(response.data)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Could not load your shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadShipments()
  }, [])

  const handleCancel = async (shipmentId: string) => {
    if (!window.confirm('Cancel this shipment? This cannot be undone.')) return
    setCancellingId(shipmentId)
    try {
      await shipmentsAPI.cancel(shipmentId)
      await loadShipments()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to cancel shipment')
    } finally {
      setCancellingId(null)
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...shipments]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .filter((s) => filter === 'ALL' || s.status === filter)
      .filter((s) => {
        if (!needle) return true
        return [s.id, s.pickupCity, s.deliveryCity, s.packageType, s.recipientName]
          .some((value) => value && value.toLowerCase().includes(needle))
      })
  }, [shipments, filter, query])

  return (
    <div>
      <div className="cust-hello">
        <h2>My shipments</h2>
        <p>Every pickup you have booked, newest first.</p>
      </div>

      <div className="cust-quick-actions">
        <button className="action-btn btn-secondary" onClick={() => void loadShipments()} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="message error">{error}</div>}

      <div className="cust-filters">
        <label className="cust-search">
          <Search />
          <input
            type="search"
            placeholder="Search by city, package, recipient…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="cust-chips">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              className={`cust-chip ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && shipments.length === 0 && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!loading && shipments.length === 0 && (
        <EmptyState title="No shipments yet" body="Book a pickup and it will show up here." />
      )}

      {!loading && shipments.length > 0 && visible.length === 0 && (
        <EmptyState title="Nothing matches" body="Try a different search or status filter." />
      )}

      {visible.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          actions={
            <>
              <button
                className="action-btn btn-secondary"
                onClick={() => onNavigate('track', { shipmentId: shipment.id })}
              >
                <Route size={16} /> Track
              </button>
              {(shipment.status === 'PENDING' || shipment.status === 'PICKUP_ASSIGNED') && (
                <button
                  className="action-btn btn-primary"
                  onClick={() => onNavigate('pickup', { shipmentId: shipment.id })}
                >
                  <KeyRound size={16} /> Pickup code
                </button>
              )}
              {shipment.status === 'PENDING' && (
                <button
                  className="action-btn btn-danger"
                  onClick={() => void handleCancel(shipment.id)}
                  disabled={cancellingId === shipment.id}
                >
                  {cancellingId === shipment.id ? 'Cancelling…' : 'Cancel shipment'}
                </button>
              )}
            </>
          }
        />
      ))}
    </div>
  )
}