import { useState, useEffect } from 'react'
import { driversAPI } from '../api.js'
import ShipmentCard, { EmptyState } from '../components/ShipmentCard.js'
import { Shipment } from '../types.js'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function DriverDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available')

  useEffect(() => {
    void loadShipments()
  }, [])

  const loadShipments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await driversAPI.getShipments()
      setShipments(response.data)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  const runAction = async (id: string, action: () => Promise<unknown>, fallback: string, ok: string) => {
    try {
      setBusyId(id)
      setError('')
      await action()
      setNotice(ok)
      setTimeout(() => setNotice(''), 3500)
      await loadShipments()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || fallback)
    } finally {
      setBusyId(null)
    }
  }

  const byNewest = (a: Shipment, b: Shipment) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')

  const availableShipments = shipments.filter((s) => s.status === 'PENDING').sort(byNewest)
  const assignedShipments = shipments
    .filter((s) => s.status === 'PICKUP_ASSIGNED' || s.status === 'PICKED_UP')
    .sort(byNewest)
  const visible = activeTab === 'available' ? availableShipments : assignedShipments

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Driver workspace</h2>
          <p>Accept nearby pickups and confirm collections.</p>
        </div>
        <div className="toolbar">
          <button className="ghost-btn" onClick={() => void loadShipments()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Available</span>
          <strong>{availableShipments.length}</strong>
        </div>
        <div className="stat-card">
          <span>My pickups</span>
          <strong>{assignedShipments.length}</strong>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {notice && <div className="message success">{notice}</div>}

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({availableShipments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          My pickups ({assignedShipments.length})
        </button>
      </div>

      {loading && shipments.length === 0 && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!loading && visible.length === 0 && (
        <EmptyState
          title={activeTab === 'available' ? 'Nothing waiting' : 'No assigned pickups'}
          body={
            activeTab === 'available'
              ? 'New customer shipments will show up here.'
              : 'Accept a shipment to start a pickup.'
          }
        />
      )}

      {visible.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          actions={
            activeTab === 'available' ? (
              <button
                className="action-btn btn-success"
                disabled={busyId === shipment.id}
                onClick={() =>
                  void runAction(
                    shipment.id,
                    () => driversAPI.accept(shipment.id),
                    'Failed to accept shipment',
                    'Shipment accepted — head to the pickup.',
                  )
                }
              >
                {busyId === shipment.id ? 'Accepting…' : 'Accept pickup'}
              </button>
            ) : (
              <button
                className="action-btn btn-primary"
                disabled={shipment.status === 'PICKED_UP' || busyId === shipment.id}
                onClick={() =>
                  void runAction(
                    shipment.id,
                    () => driversAPI.markPickedUp(shipment.id),
                    'Failed to mark as picked up',
                    'Picked up — on its way to the warehouse.',
                  )
                }
              >
                {shipment.status === 'PICKED_UP'
                  ? 'Collected'
                  : busyId === shipment.id
                    ? 'Updating…'
                    : 'Mark as picked up'}
              </button>
            )
          }
        />
      ))}
    </div>
  )
}
