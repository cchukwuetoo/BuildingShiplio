import { useState } from 'react'
import { ChevronDown, MapPin, Package } from 'lucide-react'
import { PACKAGING_LABELS, SPEED_LABELS, WizardData } from './wizard.js'

interface SummaryPanelProps {
  data: WizardData
  collapsible?: boolean
}

function formatDimensions(data: WizardData): string {
  const parts = [data.length, data.width, data.height].filter(Boolean)
  if (parts.length === 0) return '—'
  return `${parts.join(' × ')} ${data.dimensionUnit}`
}

export default function SummaryPanel({ data, collapsible = false }: SummaryPanelProps) {
  const [open, setOpen] = useState(false)

  const body = (
    <div className="wiz-summary-body">
      <div className="wiz-route-mini">
        <div className="wiz-route-stop">
          <span className="wiz-route-dot origin" />
          <div>
            <span>Pickup</span>
            <strong>
              {data.pickupCity || '—'}
              {data.pickupState ? `, ${data.pickupState}` : ''}
            </strong>
          </div>
        </div>
        <div className="wiz-route-stop">
          <span className="wiz-route-dot destination" />
          <div>
            <span>Destination</span>
            <strong>
              {data.deliveryCity || '—'}
              {data.deliveryState ? `, ${data.deliveryState}` : ''}
            </strong>
          </div>
        </div>
      </div>

      <dl className="wiz-kv">
        <div>
          <dt>Package</dt>
          <dd>{data.packageType || '—'}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>
            {data.estimatedWeight || '—'} {data.weightUnit}
          </dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>{formatDimensions(data)}</dd>
        </div>
        <div>
          <dt>Fragile</dt>
          <dd>{data.isFragile ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>Packaging</dt>
          <dd>{PACKAGING_LABELS[data.packaging]}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{SPEED_LABELS[data.speed]}</dd>
        </div>
      </dl>
    </div>
  )

  if (!collapsible) {
    return (
      <aside className="wiz-summary-card" aria-label="Shipment summary">
        <h3>
          <MapPin size={17} /> Shipment summary
        </h3>
        {body}
      </aside>
    )
  }

  return (
    <div className="wiz-summary-card">
      <button
        type="button"
        className="wiz-summary-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          <Package size={17} /> Shipment summary
        </span>
        <ChevronDown size={18} className={open ? 'rotated' : ''} />
      </button>
      {open && body}
    </div>
  )
}