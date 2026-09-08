import { useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { driversAPI } from '../api.js'
import { formatShipmentId } from '../lib/format.js'
import { Shipment } from '../types.js'

interface DriverPickupConfirmProps {
  shipment: Shipment
  onCancel: () => void
  onConfirmed: () => void
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function DriverPickupConfirm({
  shipment,
  onCancel,
  onConfirmed,
}: DriverPickupConfirmProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code the customer gives you.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await driversAPI.markPickedUp(shipment.id, code)
      onConfirmed()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'That code did not match. Ask the customer to read it again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="driver-confirm">
      <button className="ghost-btn" onClick={onCancel} disabled={loading}>
        <ArrowLeft size={16} /> Back to pickups
      </button>

      <div className="driver-confirm-card">
        <div className="driver-confirm-head">
          <span className="driver-confirm-icon">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2>Confirm pickup</h2>
            <p>Shipment #{formatShipmentId(shipment.id)}</p>
          </div>
        </div>

        <div className="driver-confirm-summary">
          <div>
            <span>Pickup from</span>
            <strong>{shipment.pickupContactName}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{shipment.pickupPhone}</strong>
          </div>
          <div className="wide">
            <span>Address</span>
            <strong>
              {shipment.pickupAddress}, {shipment.pickupCity}, {shipment.pickupState}
            </strong>
          </div>
          <div className="wide">
            <span>Package</span>
            <strong>
              {shipment.packageType} · {shipment.estimatedWeight} {shipment.weightUnit}
              {shipment.isFragile ? ' · Fragile' : ''}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="pickup-code" className="driver-confirm-label">
            Ask the customer for their 6-digit pickup code
          </label>
          <input
            id="pickup-code"
            className="otp-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            autoFocus
          />

          {error && <div className="message error">{error}</div>}

          <button type="submit" className="action-btn btn-success full" disabled={loading}>
            {loading ? 'Confirming…' : 'Confirm pickup'}
          </button>
        </form>
      </div>
    </div>
  )
}
