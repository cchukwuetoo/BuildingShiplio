export type PackagingChoice = 'own' | 'professional'
export type SpeedChoice = 'standard' | 'priority'

export interface FeeBreakdown {
  courierBase: number
  baseFee: number
  pickupFee: number
  volumetricMarkup: number
  fragileSurcharge: number
  serviceFee: number
}

export interface CarrierRate {
  rate_id: string
  carrier_name: string
  carrier_logo: string | null
  service: string
  estimated_delivery_days: string
  base_carrier_fee: number
  shiplow_service_fee: number
  total_amount: number
  currency: string
  live: boolean
  breakdown?: FeeBreakdown
}

export interface WizardData {
  pickupAddress: string
  pickupCity: string
  pickupState: string
  pickupContactName: string
  pickupPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  recipientName: string
  recipientPhone: string
  packageType: string
  description: string
  estimatedWeight: number
  weightUnit: string
  length?: number
  width?: number
  height?: number
  dimensionUnit: string
  isFragile: boolean
  packaging: PackagingChoice
  speed: SpeedChoice
  selectedRate: CarrierRate | null
  dropOffHub: string | null
}

export const defaultWizardData: WizardData = {
  pickupAddress: '',
  pickupCity: '',
  pickupState: '',
  pickupContactName: '',
  pickupPhone: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryState: '',
  recipientName: '',
  recipientPhone: '',
  packageType: 'Parcel',
  description: '',
  estimatedWeight: 1,
  weightUnit: 'kg',
  dimensionUnit: 'cm',
  isFragile: false,
  packaging: 'own',
  speed: 'standard',
  selectedRate: null,
  dropOffHub: null,
}

export function validatePickup(data: WizardData): string | null {
  if (!data.pickupContactName.trim()) return 'Add a pickup contact name.'
  if (!data.pickupPhone.trim()) return 'Add a pickup phone number.'
  if (!data.pickupAddress.trim()) return 'Add the pickup street address.'
  if (!data.pickupCity.trim()) return 'Add the pickup city.'
  if (!data.pickupState.trim()) return 'Add the pickup state.'
  return null
}

export function validateDelivery(data: WizardData): string | null {
  if (!data.recipientName.trim()) return 'Add the recipient name.'
  if (!data.recipientPhone.trim()) return 'Add the recipient phone number.'
  if (!data.deliveryAddress.trim()) return 'Add the delivery street address.'
  if (!data.deliveryCity.trim()) return 'Add the delivery city.'
  if (!data.deliveryState.trim()) return 'Add the delivery state.'
  return null
}

export function validatePackage(data: WizardData): string | null {
  if (!data.packageType.trim()) return 'Choose a package type.'
  if (!data.description.trim()) return 'Describe the package contents.'
  if (!data.estimatedWeight || data.estimatedWeight <= 0) return 'Enter a valid weight above zero.'
  return null
}

export function validateDetails(data: WizardData): string | null {
  return validatePickup(data) || validateDelivery(data) || validatePackage(data)
}

/**
 * Map wizard state onto the backend CreateShipmentDto.
 * Packaging/speed preferences are client-side only for now —
 * the shipments API has no fields for them yet.
 * Totals are recomputed server-side; only the selected quote's
 * provider identity and base price are sent.
 */
export function toCreatePayload(data: WizardData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    pickupAddress: data.pickupAddress.trim(),
    pickupCity: data.pickupCity.trim(),
    pickupState: data.pickupState.trim(),
    pickupContactName: data.pickupContactName.trim(),
    pickupPhone: data.pickupPhone.trim(),
    deliveryAddress: data.deliveryAddress.trim(),
    deliveryCity: data.deliveryCity.trim(),
    deliveryState: data.deliveryState.trim(),
    recipientName: data.recipientName.trim(),
    recipientPhone: data.recipientPhone.trim(),
    packageType: data.packageType,
    description: data.description.trim(),
    estimatedWeight: data.estimatedWeight,
    weightUnit: data.weightUnit,
    isFragile: data.isFragile,
  }
  if (data.length) payload.length = data.length
  if (data.width) payload.width = data.width
  if (data.height) payload.height = data.height
  if (data.length || data.width || data.height) payload.dimensionUnit = data.dimensionUnit
  if (data.selectedRate) {
    payload.courierProvider = data.selectedRate.carrier_name
    payload.courierService = data.selectedRate.service
    payload.courierTimeframe = data.selectedRate.estimated_delivery_days
    payload.courierBasePrice = data.selectedRate.base_carrier_fee
  }
  if (data.dropOffHub) payload.dropOffHubAddress = data.dropOffHub
  return payload
}

const KG_PER_LB = 0.453592
const CM_PER_IN = 2.54

/** Parcel-only payload for the courier rate search (nested terminal contract). */
export function toRatesPayload(data: WizardData): Record<string, unknown> {
  const toCm = (value?: number) =>
    value === undefined ? undefined : data.dimensionUnit === 'in' ? value * CM_PER_IN : value
  const weightKg =
    data.weightUnit === 'lbs' ? data.estimatedWeight * KG_PER_LB : data.estimatedWeight
  return {
    pickup: {
      city: data.pickupCity.trim(),
      state: data.pickupState.trim(),
      country: 'NG',
    },
    delivery: {
      city: data.deliveryCity.trim(),
      state: data.deliveryState.trim(),
      country: 'NG',
    },
    parcel: {
      weight_kg: Math.round(weightKg * 1000) / 1000,
      length_cm: toCm(data.length),
      width_cm: toCm(data.width),
      height_cm: toCm(data.height),
      is_fragile: data.isFragile,
      package_type: data.packageType,
    },
  }
}

export const PACKAGING_LABELS: Record<PackagingChoice, string> = {
  own: 'Own packaging',
  professional: 'Professional packing',
}

export const SPEED_LABELS: Record<SpeedChoice, string> = {
  standard: 'Standard (2–3 business days)',
  priority: 'Priority (next-day)',
}
