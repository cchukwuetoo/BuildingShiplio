import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, Truck } from 'lucide-react'
import { shipmentsAPI } from '../../../api.js'
import { formatNaira } from '../../../lib/shipments.js'
import { CourierQuote, WizardData, toRatesPayload } from './wizard.js'

interface CourierStepProps {
  data: WizardData
  onSelectQuote: (quote: CourierQuote) => void
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    return axiosError.response?.data?.message || ''
  }
  return ''
}

export default function CourierStep({ data, onSelectQuote }: CourierStepProps) {
  const [quotes, setQuotes] = useState<CourierQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await shipmentsAPI.getRates(toRatesPayload(data))
      const list = response.data?.quotes ?? []
      setQuotes(list)
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

  const selectedKey = data.selectedQuote
    ? `${data.selectedQuote.provider}|${data.selectedQuote.service}`
    : null

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

        {!loading && quotes.length > 0 && (
          <div className="wiz-option-group" role="radiogroup" aria-label="Courier options">
            {quotes.map((quote, index) => {
              const key = `${quote.provider}|${quote.service}`
              const selected = selectedKey === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`wiz-courier-card ${selected ? 'selected' : ''}`}
                  onClick={() => onSelectQuote(quote)}
                >
                  <span className="wiz-radio" aria-hidden />
                  <span className="wiz-courier-main">
                    <span className="wiz-courier-title">
                      <strong>{quote.provider}</strong>
                      {index === 0 && <span className="wiz-tag">Best price</span>}
                    </span>
                    <span className="wiz-courier-sub">
                      {quote.service} · {quote.timeframe}
                    </span>
                    <span className="wiz-courier-breakdown">
                      Base {formatNaira(quote.basePrice)} + Fee {formatNaira(quote.serviceFee)}
                    </span>
                  </span>
                  <span className="wiz-courier-price">
                    <strong>{formatNaira(quote.total)}</strong>
                    <span>Total</span>
                  </span>
                </button>
              )
            })}
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

      {data.selectedQuote && (
        <div className="message success wiz-selected-note">
          <Check size={16} /> {data.selectedQuote.provider} {data.selectedQuote.service} selected —{' '}
          {formatNaira(data.selectedQuote.total)} total.
        </div>
      )}
    </>
  )
}