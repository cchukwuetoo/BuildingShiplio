import { Shipment } from '../types.js'

/**
 * Normalize the shipments list response.
 * The API returns { shipments, total, page, limit }; older
 * responses (and mocks) may return a bare array.
 */
export function toShipmentList(data: unknown): Shipment[] {
  if (Array.isArray(data)) return data as Shipment[]
  if (typeof data === 'object' && data !== null && 'shipments' in data) {
    const list = (data as { shipments?: unknown }).shipments
    if (Array.isArray(list)) return list as Shipment[]
  }
  return []
}

export function formatNaira(value?: number | null): string {
  if (value === undefined || value === null) return '—'
  return `₦${value.toLocaleString()}`
}
