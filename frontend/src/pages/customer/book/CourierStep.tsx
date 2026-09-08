import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, Truck } from 'lucide-react'
import { shipmentsAPI } from '../../../api.js'
import { formatNaira } from '../../../lib/shipments.js'
import { CarrierRate, WizardData, toRatesPayload } from './wizard.js'

interface CourierStepProps {
  data: WizardData
  onSelectRate: (rate: CarrierRate, dropOffHub: string | null) => void
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function CourierStep({ data, onSelectRate }: CourierStepProps) {
  const [rates, setRates] = useState<CarrierRate[]>([])
  const [hub, setHub] = useState<string | null>(null)
  const [isInternational, setIsInternational] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await shipmentsAPI.getRates(toRatesPayload(data))
      const list = response.data?.rates ?? []
      setRates(list)
      setHub(response.data?.drop_off_hub_address ?? null)
      setIsInternational(response.data?.is_international ?? false)
      if (list.length === 0) {
        setError('No courier rates came back. Try again.')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Could not fetch courier rates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRates()
  }, [loadRates])

  const selectedId = data.selectedRate?.rate_id ?? null

  return (
    <>
      <div className="form-container">
        <h3>
          <Truck size={18} /> Select courier
        </h3>
        <p className="form-lede">
          Compare rates and delivery times from our trusted partners. Prices include the ShipLow
          service fee.
        </p>

        {loading && (
          <p className="loading-text">
            <span className="spinner" /> Fetching live courier rates…
          </p>
        )}

        {error && <div className="message error">{error}</div>}

        {!loading && rates.length > 0 && (
          <div className="wiz-option-group" role="radiogroup" aria-label="Courier options">
            {rates.map((rate, index) => {
              const selected = selectedId === rate.rate_id
              return (
                <button
                  key={rate.rate_id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`wiz-courier-card ${selected ? 'selected' : ''}`}
                  onClick={() => onSelectRate(rate, hub)}
                >
                  <span className="wiz-radio" aria-hidden />
                  {rate.carrier_logo ? (
                    <img
                      src={rate.carrier_logo}
                      alt=""
                      className="wiz-carrier-logo"
                      loading="lazy"
                    />
                  ) : (
                    <span className="wiz-carrier-logo wiz-carrier-initial" aria-hidden>
                      {rate.carrier_name[0]}
                    </span>
                  )}
                  <span className="wiz-courier-main">
                    <span className="wiz-courier-title">
                      <strong>{rate.carrier_name}</strong>
                      {index === 0 && <span className="wiz-tag">Best price</span>}
                      {rate.live && <span className="wiz-live-badge">Live</span>}
                    </span>
                    <span className="wiz-courier-sub">
                      {rate.service} · {rate.estimated_delivery_days}
                    </span>
                    <span className="wiz-courier-breakdown">
                      Base {formatNaira(rate.base_carrier_fee)} + Fee{' '}
                      {formatNaira(rate.shiplow_service_fee)}
                    </span>
                  </span>
                  <span className="wiz-courier-price">
                    <strong>{formatNaira(rate.total_amount)}</strong>
                    <span>Total</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!loading && isInternational && hub && (
          <div className="message success wiz-hub-note">
            International shipment — drop off at <strong>{hub}</strong>.
          </div>
        )}

        {!loading && (
          <button
            type="button"
            className="action-btn btn-secondary wiz-refresh-rates"
            onClick={() => void loadRates()}
          >
            <RefreshCw size={16} /> Refresh rates
          </button>
        )}
      </div>

      {data.selectedRate && (
        <div className="message success wiz-selected-note">
          <Check size={16} /> {data.selectedRate.carrier_name} {data.selectedRate.service} selected
          — {formatNaira(data.selectedRate.total_amount)} total.
        </div>
      )}
    </>
  )
}
