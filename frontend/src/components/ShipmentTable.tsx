import { ChevronRight } from 'lucide-react'
import { Shipment } from '../types.js'
import { formatDate, formatStatus, statusClass } from '../lib/format.js'
import { formatNaira } from '../lib/shipments.js'

interface ShipmentTableProps {
  shipments: Shipment[]
  onView: (id: string) => void
  onCancel?: (id: string) => void
  cancellingId?: string | null
}

const CANCELLABLE = ['PENDING', 'PENDING_PAYMENT']

export default function ShipmentTable({
  shipments,
  onView,
  onCancel,
  cancellingId,
}: ShipmentTableProps) {
  return (
    <div className="ship-table-wrap">
      <table className="ship-table">
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Route</th>
            <th scope="col">Status</th>
            <th scope="col">Booked</th>
            <th scope="col">Total</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr
              key={shipment.id}
              onClick={() => onView(shipment.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onView(shipment.id)
              }}
              tabIndex={0}
              aria-label={`View shipment to ${shipment.deliveryCity}`}
            >
              <td className="cell-main">
                <span className="ship-table-desc" title={shipment.description}>
                  {shipment.description}
                </span>
                <span className="ship-table-sub">
                  {shipment.packageType}
                  {shipment.isFragile ? ' · Fragile' : ''}
                </span>
              </td>
              <td data-label="Route">
                <span className="ship-table-route">
                  {shipment.pickupCity} → {shipment.deliveryCity}
                </span>
              </td>
              <td data-label="Status">
                <span className={`status-badge ${statusClass(shipment.status)}`}>
                  {formatStatus(shipment.status)}
                </span>
              </td>
              <td data-label="Booked" className="nowrap">{formatDate(shipment.createdAt)}</td>
              <td data-label="Total" className="nowrap">{formatNaira(shipment.totalCost)}</td>
              <td
                className="ship-table-actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn btn-secondary"
                  onClick={() => onView(shipment.id)}
                  aria-label={`View shipment to ${shipment.deliveryCity}`}
                >
                  View <ChevronRight size={14} />
                </button>
                {onCancel && CANCELLABLE.includes(shipment.status) && (
                  <button
                    className="action-btn btn-danger"
                    disabled={cancellingId === shipment.id}
                    onClick={() => onCancel(shipment.id)}
                  >
                    {cancellingId === shipment.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
