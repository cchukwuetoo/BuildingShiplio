export type Shipment = {
  id: string
  status: string
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
  isFragile?: boolean
  pickedUpAt?: string
  receivedAt?: string
  readyForDispatchAt?: string
}

export type User = {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}
