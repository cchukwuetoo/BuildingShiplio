const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending pickup',
  PICKUP_ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked up',
  RECEIVED_AT_WAREHOUSE: 'At warehouse',
  PROCESSING: 'Processing',
  READY_FOR_DISPATCH: 'Ready to dispatch',
  CANCELLED: 'Cancelled',
}

const ROLE_LABELS: Record<string, string> = {
  DRIVER: 'Driver',
  WAREHOUSE: 'Warehouse',
  USER: 'Customer',
  SUPER_ADMIN: 'Admin',
}

export function formatStatus(status: string) {
  return STATUS_LABELS[status] || status.replace(/_/g, ' ').toLowerCase()
}

export function statusClass(status: string) {
  return `status-${status.toLowerCase().replace(/_/g, '-')}`
}

export function formatShipmentId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

export function formatRole(role: string | null) {
  if (!role) return ''
  return ROLE_LABELS[role] || role
}

export function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
