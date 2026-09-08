import { Pencil } from 'lucide-react'
import { formatNaira } from '../../../lib/shipments.js'
import { PACKAGING_LABELS, SPEED_LABELS, WizardData } from './wizard.js'

interface ReviewStepProps {
  data: WizardData
  onEdit: (step: number) => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="wiz-review-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const dims = [data.length, data.width, data.height].filter(Boolean)

  return (
    <>
      <div className="form-container">
        <div className="wiz-review-head">
          <h3>Pickup</h3>
          <button type="button" className="wiz-edit-btn" onClick={() => onEdit(0)}>
            <Pencil size={14} /> Edit
          </button>
        </div>
        <dl>
          <Row label="Contact" value={`${data.pickupContactName} · ${data.pickupPhone}`} />
          <Row
            label="Address"
            value={`${data.pickupAddress}, ${data.pickupCity}, ${data.pickupState}`}
          />
        </dl>
      </div>

      <div className="form-container">
        <div className="wiz-review-head">
          <h3>Delivery</h3>
          <button type="button" className="wiz-edit-btn" onClick={() => onEdit(0)}>
            <Pencil size={14} /> Edit
          </button>
        </div>
        <dl>
          <Row label="Recipient" value={`${data.recipientName} · ${data.recipientPhone}`} />
          <Row
            label="Address"
            value={`${data.deliveryAddress}, ${data.deliveryCity}, ${data.deliveryState}`}
          />
        </dl>
      </div>

      <div className="form-container">
        <div className="wiz-review-head">
          <h3>Package & options</h3>
          <button type="button" className="wiz-edit-btn" onClick={() => onEdit(1)}>
            <Pencil size={14} /> Edit
          </button>
        </div>
        <dl>
          <Row label="Type" value={data.packageType} />
          <Row label="Description" value={data.description} />
          <Row label="Weight" value={`${data.estimatedWeight} ${data.weightUnit}`} />
          <Row
            label="Dimensions"
            value={dims.length > 0 ? `${dims.join(' × ')} ${data.dimensionUnit}` : '—'}
          />
          <Row label="Fragile" value={data.isFragile ? 'Yes — handle with extra care' : 'No'} />
          <Row label="Packaging" value={PACKAGING_LABELS[data.packaging]} />
          <Row label="Speed" value={SPEED_LABELS[data.speed]} />
        </dl>
      </div>

      {data.selectedRate && (
        <div className="form-container">
          <div className="wiz-review-head">
            <h3>Courier & price</h3>
            <button type="button" className="wiz-edit-btn" onClick={() => onEdit(2)}>
              <Pencil size={14} /> Edit
            </button>
          </div>
          <dl>
            <Row
              label="Courier"
              value={`${data.selectedRate.carrier_name} · ${data.selectedRate.service}`}
            />
            <Row label="Timeframe" value={data.selectedRate.estimated_delivery_days} />
            <Row label="Courier base" value={formatNaira(data.selectedRate.base_carrier_fee)} />
            <Row label="Service fee" value={formatNaira(data.selectedRate.shiplow_service_fee)} />
            <Row label="Total" value={formatNaira(data.selectedRate.total_amount)} />
            {data.dropOffHub && <Row label="Drop-off hub" value={data.dropOffHub} />}
          </dl>
        </div>
      )}
    </>
  )
}