import { useEffect, useState } from 'react'
import { shipmentsAPI } from '../api.js'
import ShipmentCard, { EmptyState } from '../components/ShipmentCard.js'
import { Shipment } from '../types.js'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

interface CreateShipmentForm {
  pickupAddress: string
  pickupCity: string
  pickupState: string
  pickupContactName: string
  pickupPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  recipientName: string
  recipientPhone: string
  packageType: string
  description: string
  estimatedWeight: number
  weightUnit: string
  isFragile: boolean
  declaredValue?: number
}

const emptyForm: CreateShipmentForm = {
  pickupAddress: '',
  pickupCity: '',
  pickupState: '',
  pickupContactName: '',
  pickupPhone: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryState: '',
  recipientName: '',
  recipientPhone: '',
  packageType: 'Document',
  description: '',
  estimatedWeight: 1,
  weightUnit: 'kg',
  isFragile: false,
}

export default function CustomerDashboard() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [form, setForm] = useState<CreateShipmentForm>(emptyForm)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadShipments = async () => {
    try {
      setListLoading(true)
      const response = await shipmentsAPI.getAll()
      setShipments(response.data)
    } catch {
      setShipments([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void loadShipments()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? value === ''
              ? undefined
              : Number(value)
            : value,
    }))
  }

  const handleCancel = async (shipmentId: string) => {
    setError('')
    setSuccess('')
    setCancellingId(shipmentId)
    try {
      await shipmentsAPI.cancel(shipmentId)
      setSuccess('Shipment cancelled.')
      await loadShipments()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to cancel shipment')
    } finally {
      setCancellingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await shipmentsAPI.create(form)
      setSuccess('Shipment booked. A driver can now accept the pickup.')
      setForm(emptyForm)
      setShowForm(false)
      await loadShipments()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create shipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customer workspace</h2>
          <p>Book a pickup and follow it through to dispatch.</p>
        </div>
        <div className="toolbar">
          <button className="ghost-btn" onClick={() => void loadShipments()} disabled={listLoading}>
            Refresh
          </button>
          <button className="action-btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close form' : 'New shipment'}
          </button>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {showForm && (
        <div className="form-container">
          <h3>New shipment</h3>
          <p className="form-lede">Pickup, delivery, and package details in one pass.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Pickup</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupContactName">Contact name</label>
                  <input
                    id="pickupContactName"
                    type="text"
                    name="pickupContactName"
                    value={form.pickupContactName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupPhone">Phone</label>
                  <input
                    id="pickupPhone"
                    type="tel"
                    name="pickupPhone"
                    value={form.pickupPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="pickupAddress">Street address</label>
                <input
                  id="pickupAddress"
                  type="text"
                  name="pickupAddress"
                  value={form.pickupAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupCity">City</label>
                  <input
                    id="pickupCity"
                    type="text"
                    name="pickupCity"
                    value={form.pickupCity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupState">State</label>
                  <input
                    id="pickupState"
                    type="text"
                    name="pickupState"
                    value={form.pickupState}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Delivery</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="recipientName">Recipient name</label>
                  <input
                    id="recipientName"
                    type="text"
                    name="recipientName"
                    value={form.recipientName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientPhone">Phone</label>
                  <input
                    id="recipientPhone"
                    type="tel"
                    name="recipientPhone"
                    value={form.recipientPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="deliveryAddress">Street address</label>
                <input
                  id="deliveryAddress"
                  type="text"
                  name="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deliveryCity">City</label>
                  <input
                    id="deliveryCity"
                    type="text"
                    name="deliveryCity"
                    value={form.deliveryCity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deliveryState">State</label>
                  <input
                    id="deliveryState"
                    type="text"
                    name="deliveryState"
                    value={form.deliveryState}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Package</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="packageType">Type</label>
                  <select
                    id="packageType"
                    name="packageType"
                    value={form.packageType}
                    onChange={handleInputChange}
                  >
                    <option>Document</option>
                    <option>Parcel</option>
                    <option>Box</option>
                    <option>Envelope</option>
                  </select>
                </div>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="isFragile"
                    checked={form.isFragile}
                    onChange={handleInputChange}
                  />
                  Fragile handling
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estimatedWeight">Weight</label>
                  <input
                    id="estimatedWeight"
                    type="number"
                    name="estimatedWeight"
                    value={form.estimatedWeight}
                    onChange={handleInputChange}
                    step="0.1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="weightUnit">Unit</label>
                  <select
                    id="weightUnit"
                    name="weightUnit"
                    value={form.weightUnit}
                    onChange={handleInputChange}
                  >
                    <option>kg</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="declaredValue">Declared value (optional)</label>
                <input
                  id="declaredValue"
                  type="number"
                  name="declaredValue"
                  value={form.declaredValue || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Booking…' : 'Book shipment'}
            </button>
          </form>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <span>Your shipments</span>
          <strong>{shipments.length}</strong>
        </div>
      </div>

      {listLoading && shipments.length === 0 && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!listLoading && shipments.length === 0 && !showForm && (
        <EmptyState title="No shipments yet" body="Book a pickup to get started." />
      )}

      {shipments.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          actions={
            shipment.status === 'PENDING' ? (
              <button
                className="action-btn btn-danger"
                onClick={() => void handleCancel(shipment.id)}
                disabled={cancellingId === shipment.id}
              >
                {cancellingId === shipment.id ? 'Cancelling…' : 'Cancel shipment'}
              </button>
            ) : undefined
          }
        />
      ))}

      <div className="info-box">
        <h3>How a shipment moves</h3>
        <ol>
          <li>
            <strong>Book:</strong> pickup and delivery details go live for drivers.
          </li>
          <li>
            <strong>Pickup:</strong> a driver accepts and collects the package.
          </li>
          <li>
            <strong>Warehouse:</strong> staff receive and process inbound freight.
          </li>
          <li>
            <strong>Dispatch:</strong> once ready, it can leave for the recipient.
          </li>
        </ol>
      </div>
    </div>
  )
}
