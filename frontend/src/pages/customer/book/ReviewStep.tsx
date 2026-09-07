import { Pencil } from 'lucide-react'
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
    </>
  )
}