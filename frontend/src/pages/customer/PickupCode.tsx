import { useEffect, useMemo, useState } from 'react'
import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import { shipmentsAPI } from '../../api.js'
import { formatShipmentId, formatStatus } from '../../lib/format.js'
import { Shipment } from '../../types.js'

interface PickupCodeProps {
  initialShipmentId?: string
}

const ELIGIBLE = ['PENDING', 'PICKUP_ASSIGNED']

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

function timeLeft(expiresAt?: string): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (Number.isNaN(ms) || ms <= 0) return 'expired'
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PickupCode({ initialShipmentId }: PickupCodeProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedId, setSelectedId] = useState<string>(initialShipmentId ?? '')
  const [code, setCode] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingCode, setLoadingCode] = useState(false)
  const [error, setError] = useState('')
  const [, forceTick] = useState(0)

  const eligible = useMemo(
    () =>
      [...shipments]
        .filter((s) => ELIGIBLE.includes(s.status))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [shipments],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingList(true)
      setError('')
      try {
        const response = await shipmentsAPI.getAll()
        if (cancelled) return
        const list: Shipment[] = response.data
        setShipments(list)
        const first = list.find((s) => ELIGIBLE.includes(s.status))
        setSelectedId((prev) =>
          prev && list.some((s) => s.id === prev && ELIGIBLE.includes(s.status))
            ? prev
            : first?.id ?? '',
        )
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err) || 'Could not load your shipments.')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchCode = async (shipmentId: string) => {
    if (!shipmentId) {
      setCode('')
      setExpiresAt(undefined)
      return
    }
    setLoadingCode(true)
    setError('')
    try {
      const response = await shipmentsAPI.getPickupOtp(shipmentId)
      setCode(response.data.code)
      setExpiresAt(response.data.expiresAt)
    } catch (err: unknown) {
      setCode('')
      setExpiresAt(undefined)
      setError(getErrorMessage(err) || 'Could not get a pickup code for this shipment.')
    } finally {
      setLoadingCode(false)
    }
  }

  useEffect(() => {
    void fetchCode(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const selected = eligible.find((s) => s.id === selectedId)
  const remaining = timeLeft(expiresAt)

  return (
    <div>
      <div className="cust-hello">
        <h2>Pickup code</h2>
        <p>Show this code to the driver when they arrive. It confirms they are collecting from you.</p>
      </div>

      {error && <div className="message error">{error}</div>}

      {loadingList && (
        <p className="loading-text">
          <span className="spinner" /> Loading shipments…
        </p>
      )}

      {!loadingList && eligible.length === 0 && (
        <div className="info-box">
          <h3>No pickups waiting</h3>
          <p>
            A pickup code appears here once you have a shipment that is pending or has a driver
            assigned. Book a shipment to get started.
          </p>
        </div>
      )}

      {!loadingList && eligible.length > 0 && (
        <>
          <div className="cust-track-search">
            <h3>Choose a shipment</h3>
            <label className="cust-field">
              <span>Shipment</span>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {eligible.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{formatShipmentId(s.id)} · {s.pickupCity} → {s.deliveryCity} ·{' '}
                    {formatStatus(s.status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="otp-code-card">
            <div className="otp-code-head">
              <span className="otp-code-icon">
                <KeyRound size={18} />
              </span>
              <div>
                <strong>Pickup code</strong>
                {selected && <span>Shipment #{formatShipmentId(selected.id)}</span>}
              </div>
            </div>

            {loadingCode ? (
              <p className="loading-text">
                <span className="spinner" /> Getting your code…
              </p>
            ) : code ? (
              <>
                <div className="otp-digits" aria-label={`Pickup code ${code.split('').join(' ')}`}>
                  {code.split('').map((digit, i) => (
                    <span key={i}>{digit}</span>
                  ))}
                </div>
                <p className="otp-code-meta">
                  {remaining === 'expired'
                    ? 'This code has expired — refresh to get a new one.'
                    : `Expires in ${remaining}`}
                </p>
              </>
            ) : (
              <p className="otp-code-meta">No code available.</p>
            )}

            <button
              className="action-btn btn-secondary"
              onClick={() => void fetchCode(selectedId)}
              disabled={loadingCode || !selectedId}
            >
              <RefreshCw size={16} /> Refresh code
            </button>
          </div>

          <div className="info-box">
            <h3>
              <ShieldCheck size={16} /> How it works
            </h3>
            <ol>
              <li>The driver accepts your shipment and travels to the pickup address.</li>
              <li>When they arrive, read out or show them this 6-digit code.</li>
              <li>The driver enters it in their app to confirm the collection.</li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
