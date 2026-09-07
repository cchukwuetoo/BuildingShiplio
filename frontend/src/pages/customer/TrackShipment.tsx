import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Package,
  UserCheck,
  Truck,
  Warehouse,
  Boxes,
  Rocket,
  XCircle,
} from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { formatDate, formatStatus } from '../../lib/format.js'
import { Shipment } from '../../types.js'

interface TrackShipmentProps {
  initialShipmentId?: string
}

const STEP_DEFS = [
  { status: 'PENDING', label: 'Shipment booked', icon: Package, getTime: (s: Shipment) => s.createdAt },
  { status: 'PICKUP_ASSIGNED', label: 'Driver assigned', icon: UserCheck, getTime: (s: Shipment) => s.assignedAt },
  { status: 'PICKED_UP', label: 'Picked up', icon: Truck, getTime: (s: Shipment) => s.pickedUpAt },
  { status: 'RECEIVED_AT_WAREHOUSE', label: 'Received at warehouse', icon: Warehouse, getTime: (s: Shipment) => s.receivedAt },
  { status: 'PROCESSING', label: 'Processing', icon: Boxes, getTime: (s: Shipment) => s.processingStartedAt },
  { status: 'READY_FOR_DISPATCH', label: 'Ready for dispatch', icon: Rocket, getTime: (s: Shipment) => s.readyForDispatchAt },
]

export default function TrackShipment({ initialShipmentId }: TrackShipmentProps) {
  const [ownShipments, setOwnShipments] = useState<Shipment[]>([])
  const [query, setQuery] = useState('')
  const [tracked, setTracked] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOne = async (shipmentId: string): Promise<Shipment | null> => {
    try {
      const response = await shipmentsAPI.getOne(shipmentId)
      return response.data?.shipment ?? response.data ?? null
    } catch {
      return null
    }
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await shipmentsAPI.getAll()
        const all = response.data
        if (cancelled) return
        setOwnShipments(all)
        const pendingId = initialShipmentId
        const target = pendingId
          ? (await fetchOne(pendingId)) || all.find((s: Shipment) => s.id === pendingId) || null
          : null
        if (!cancelled) setTracked(target)
      } catch {
        if (!cancelled) setError('Could not load shipments.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [initialShipmentId])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const needle = query.trim()
    if (!needle) return
    setLoading(true)
    setError('')
    const found = (await fetchOne(needle)) || ownShipments.find((s) => s.id.includes(needle) || needle.includes(s.id))
    if (found) {
      setTracked(found)
    } else {
      setTracked(null)
      setError('No shipment matches that tracking ID.')
    }
    setLoading(false)
  }

  const currentIndex = tracked ? STEP_DEFS.findIndex((s) => s.status === tracked.status) : -1
  const isCancelled = tracked?.status === 'CANCELLED'

  const steps = useMemo(() => {
    if (!tracked) return []
    return STEP_DEFS.map((step, i) => ({
      ...step,
      time: step.getTime(tracked),
      state:
        isCancelled && i < currentIndex
          ? 'done'
          : i < currentIndex
            ? 'done'
            : i === currentIndex && !isCancelled
              ? 'current'
              : 'todo',
    }))
  }, [tracked, currentIndex, isCancelled])

  const detailItems = tracked
    ? [
        { label: 'Package', value: tracked.packageType },
        { label: 'Weight', value: `${tracked.estimatedWeight} ${tracked.weightUnit}` },
        { label: 'Fragile', value: tracked.isFragile ? 'Yes' : 'No' },
        { label: 'Declared value', value: tracked.declaredValue ? `₦${tracked.declaredValue.toLocaleString()}` : '—' },
      ]
    : []

  return (
    <div>
      <div className="cust-hello">
        <h2>Track a package</h2>
        <p>See exactly where a shipment is in the pipeline.</p>
      </div>

      <div className="cust-track-search">
        <h3>Look up a shipment</h3>
        <form className="cust-track-form" onSubmit={(e) => void handleTrack(e)}>
          <label className="cust-search">
            <Search />
            <input
              type="text"
              placeholder="Paste a tracking ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            value={initialShipmentId ?? ''}
            onChange={(e) => {
              const id = e.target.value
              if (id) void fetchOne(id).then((s) => setTracked(s))
            }}
            disabled={ownShipments.length === 0}
          >
            <option value="">— or choose one of yours —</option>
            {ownShipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id.slice(0, 8).toUpperCase()} · {s.pickupCity} → {s.deliveryCity}
              </option>
            ))}
          </select>
          <button type="submit" className="action-btn btn-primary">
            Track
          </button>
        </form>
      </div>

      {error && <div className="message error">{error}</div>}

      {loading && (
        <p className="loading-text">
          <span className="spinner" /> Loading tracking…
        </p>
      )}

      {!loading && tracked && (
        <>
          <div className="cust-section-title">
            <h3>
              Shipment #{tracked.id.slice(0, 8).toUpperCase()}
            </h3>
            <span className={`status-badge ${'status-' + tracked.status.toLowerCase().replace(/_/g, '-')}`}>
              {formatStatus(tracked.status)}
            </span>
          </div>

          <div className="shipment-card">
            <div className="route">
              <div className="route-stop">
                <span className="route-label">Pickup</span>
                <strong>
                  {tracked.pickupCity}, {tracked.pickupState}
                </strong>
                <p>{tracked.pickupAddress}</p>
                <p className="route-meta">
                  {tracked.pickupContactName} · {tracked.pickupPhone}
                </p>
              </div>
              <div className="route-arrow" aria-hidden>
                →
              </div>
              <div className="route-stop">
                <span className="route-label">Delivery</span>
                <strong>
                  {tracked.deliveryCity}, {tracked.deliveryState}
                </strong>
                <p>{tracked.deliveryAddress}</p>
                <p className="route-meta">
                  {tracked.recipientName} · {tracked.recipientPhone}
                </p>
              </div>
            </div>

            <ul className="cust-timeline">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <li key={step.status} className={`cust-timeline-item ${step.state}`}>
                    <span className="cust-timeline-dot">
                      <Icon size={14} />
                    </span>
                    <div className="cust-timeline-head">
                      <strong>{step.label}</strong>
                      <span className="cust-timeline-time">{formatDate(step.time)}</span>
                    </div>
                  </li>
                )
              })}
              {isCancelled && (
                <li className="cust-timeline-item done">
                  <span className="cust-timeline-dot">
                    <XCircle size={14} />
                  </span>
                  <div className="cust-timeline-head">
                    <strong>Cancelled</strong>
                  </div>
                </li>
              )}
              </ul>

            <div className="cust-track-details">
              {detailItems.map((item) => (
                <div key={item.label} className="cust-detail-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !tracked && (
        <div className="info-box">
          <h3>How tracking works</h3>
          <ol>
            <li>
              <strong>Book:</strong> the shipment is created with status <em>Pending pickup</em>.
            </li>
            <li>
              <strong>Pickup:</strong> a driver accepts, then collects the package.
            </li>
            <li>
              <strong>Warehouse:</strong> staff receive and process the freight.
            </li>
            <li>
              <strong>Dispatch:</strong> the package is ready to leave for the recipient.
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}