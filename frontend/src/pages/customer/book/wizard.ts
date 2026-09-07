export type PackagingChoice = 'own' | 'professional'
export type SpeedChoice = 'standard' | 'priority'

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
  return payload
}

export const PACKAGING_LABELS: Record<PackagingChoice, string> = {
  own: 'Own packaging',
  professional: 'Professional packing',
}

export const SPEED_LABELS: Record<SpeedChoice, string> = {
  standard: 'Standard (2–3 business days)',
  priority: 'Priority (next-day)',
}
