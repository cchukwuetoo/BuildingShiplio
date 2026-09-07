import { useState } from 'react'
import { PackagePlus, Route } from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { CustomerView } from '../../components/CustomerSidebar.js'

interface BookShipmentProps {
  onNavigate: (view: CustomerView, opts?: { shipmentId?: string }) => void
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
  packageType: 'Parcel',
  description: '',
  estimatedWeight: 1,
  weightUnit: 'kg',
  isFragile: false,
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function BookShipment({ onNavigate }: BookShipmentProps) {
  const [form, setForm] = useState<CreateShipmentForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await shipmentsAPI.create(form)
      const created = response.data?.shipment ?? response.data
      setCreatedId(created?.id ?? null)
      setForm(emptyForm)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to book the shipment')
    } finally {
      setLoading(false)
    }
  }

  if (createdId) {
    return (
      <div>
        <div className="cust-hello">
          <h2>Shipment booked 🎉</h2>
          <p>A driver can now accept the pickup request.</p>
        </div>
        <div className="message success">
          We&apos;ve created shipment <strong>#{createdId.slice(0, 8).toUpperCase()}</strong>. You can follow
          it in real time.
        </div>
        <div className="cust-quick-actions">
          <button
            className="action-btn btn-primary"
            onClick={() => onNavigate('track', { shipmentId: createdId })}
          >
            <Route size={17} /> Track it now
          </button>
          <button className="action-btn btn-secondary" onClick={() => setCreatedId(null)}>
            Book another shipment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="cust-hello">
        <h2>Book a shipment</h2>
        <p>Pickup, delivery, and package details in one pass.</p>
      </div>

      {error && <div className="message error">{error}</div>}

      <div className="form-container">
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
                <label htmlFor="estimatedWeight">Estimated weight</label>
                <input
                  id="estimatedWeight"
                  type="number"
                  name="estimatedWeight"
                  value={form.estimatedWeight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
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
              <label htmlFor="declaredValue">Declared value (₦, optional)</label>
              <input
                id="declaredValue"
                type="number"
                name="declaredValue"
                value={form.declaredValue || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <PackagePlus size={17} />
            {loading ? 'Booking…' : 'Book shipment'}
          </button>
        </form>
      </div>
    </div>
  )
}