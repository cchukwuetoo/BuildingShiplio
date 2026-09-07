import { ReactNode } from 'react'
import { Shipment } from '../types.js'
import { formatDate, formatShipmentId, formatStatus, statusClass } from '../lib/format.js'

type Field = { label: string; value: ReactNode }

interface ShipmentCardProps {
  shipment: Shipment
  extra?: Field[]
  actions?: ReactNode
}

export default function ShipmentCard({ shipment, extra, actions }: ShipmentCardProps) {
  return (
    <article className="shipment-card">
      <header className="shipment-card-head">
        <div>
          <p className="shipment-kicker">Shipment</p>
          <h3>#{formatShipmentId(shipment.id)}</h3>
        </div>
        <span className={`status-badge ${statusClass(shipment.status)}`}>
          {formatStatus(shipment.status)}
        </span>
      </header>

      <div className="route">
        <div className="route-stop">
          <span className="route-label">Pickup</span>
          <strong>
            {shipment.pickupCity}, {shipment.pickupState}
          </strong>
          <p>{shipment.pickupAddress}</p>
          <p className="route-meta">
            {shipment.pickupContactName} · {shipment.pickupPhone}
          </p>
        </div>
        <div className="route-arrow" aria-hidden>
          →
        </div>
        <div className="route-stop">
          <span className="route-label">Delivery</span>
          <strong>
            {shipment.deliveryCity}, {shipment.deliveryState}
          </strong>
          <p>{shipment.deliveryAddress}</p>
          <p className="route-meta">
            {shipment.recipientName} · {shipment.recipientPhone}
          </p>
        </div>
      </div>

      <div className="package-details">
        <div>
          <span>Package</span>
          <strong>
            {shipment.packageType}
            {shipment.isFragile ? ' · Fragile' : ''}
          </strong>
        </div>
        <div>
          <span>Weight</span>
          <strong>
            {shipment.estimatedWeight} {shipment.weightUnit}
          </strong>
        </div>
        <div className="package-desc">
          <span>Notes</span>
          <strong>{shipment.description || '—'}</strong>
        </div>
        {extra?.map((field) => (
          <div key={field.label}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>

      {actions && <div className="action-buttons">{actions}</div>}
    </article>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden>
        ▢
      </div>
      <p className="empty-title">{title}</p>
      <p>{body}</p>
    </div>
  )
}

export function formatExtraDate(label: string, value?: string): Field {
  return { label, value: formatDate(value) }
}
