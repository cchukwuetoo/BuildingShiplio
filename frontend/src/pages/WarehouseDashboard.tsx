import { useState, useEffect } from 'react'
import { warehouseAPI } from '../api.js'
import ShipmentCard, { EmptyState, formatExtraDate } from '../components/ShipmentCard.js'
import { Shipment } from '../types.js'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function WarehouseDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inbox' | 'processing' | 'ready'>('inbox')

  useEffect(() => {
    void loadShipments()
  }, [])

  const loadShipments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await warehouseAPI.getShipments()
      setShipments(response.data)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  const runAction = async (id: string, action: () => Promise<unknown>, fallback: string) => {
    try {
      setBusyId(id)
      setError('')
      await action()
      await loadShipments()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || fallback)
    } finally {
      setBusyId(null)
    }
  }

  const inboxShipments = shipments.filter((s) => s.status === 'PICKED_UP')
  const processingShipments = shipments.filter(
    (s) => s.status === 'RECEIVED_AT_WAREHOUSE' || s.status === 'PROCESSING',
  )
  const readyShipments = shipments.filter((s) => s.status === 'READY_FOR_DISPATCH')

  const visible =
    activeTab === 'inbox'
      ? inboxShipments
      : activeTab === 'processing'
        ? processingShipments
        : readyShipments

  const emptyCopy = {
    inbox: { title: 'Inbox is clear', body: 'Incoming pickups will land here.' },
    processing: { title: 'Nothing in process', body: 'Receive a shipment to start processing.' },
    ready: { title: 'No dispatch queue', body: 'Processed shipments will appear here.' },
  }[activeTab]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Warehouse workspace</h2>
          <p>Receive inbound freight, process it, and release for dispatch.</p>
        </div>
        <button className="ghost-btn" onClick={() => void loadShipments()} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Inbox</span>
          <strong>{inboxShipments.length}</strong>
        </div>
        <div className="stat-card">
          <span>Processing</span>
          <strong>{processingShipments.length}</strong>
        </div>
        <div className="stat-card">
          <span>Ready</span>
          <strong>{readyShipments.length}</strong>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox ({inboxShipments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveTab('processing')}
        >
          Processing ({processingShipments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          Ready ({readyShipments.length})
        </button>
      </div>

      {loading && shipments.length === 0 && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!loading && visible.length === 0 && <EmptyState title={emptyCopy.title} body={emptyCopy.body} />}

      {visible.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          extra={
            activeTab === 'inbox'
              ? [formatExtraDate('Picked up', shipment.pickedUpAt)]
              : activeTab === 'processing'
                ? [formatExtraDate('Received', shipment.receivedAt)]
                : [formatExtraDate('Ready since', shipment.readyForDispatchAt)]
          }
          actions={
            activeTab === 'inbox' ? (
              <button
                className="action-btn btn-success"
                disabled={busyId === shipment.id}
                onClick={() =>
                  void runAction(
                    shipment.id,
                    () => warehouseAPI.receive(shipment.id),
                    'Failed to receive shipment',
                  )
                }
              >
                {busyId === shipment.id ? 'Receiving…' : 'Receive shipment'}
              </button>
            ) : activeTab === 'processing' && shipment.status === 'RECEIVED_AT_WAREHOUSE' ? (
              <button
                className="action-btn btn-primary"
                disabled={busyId === shipment.id}
                onClick={() =>
                  void runAction(
                    shipment.id,
                    () => warehouseAPI.startProcessing(shipment.id),
                    'Failed to start processing',
                  )
                }
              >
                {busyId === shipment.id ? 'Starting…' : 'Start processing'}
              </button>
            ) : activeTab === 'processing' && shipment.status === 'PROCESSING' ? (
              <button
                className="action-btn btn-success"
                disabled={busyId === shipment.id}
                onClick={() =>
                  void runAction(
                    shipment.id,
                    () => warehouseAPI.markReady(shipment.id),
                    'Failed to mark as ready',
                  )
                }
              >
                {busyId === shipment.id ? 'Updating…' : 'Mark ready for dispatch'}
              </button>
            ) : undefined
          }
        />
      ))}
    </div>
  )
}
