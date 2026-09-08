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
  length?: number
  width?: number
  height?: number
  dimensionUnit?: string
  isFragile?: boolean
  declaredValue?: number
  createdAt?: string
  assignedAt?: string
  pickedUpAt?: string
  receivedAt?: string
  processingStartedAt?: string
  readyForDispatchAt?: string
  cancelledAt?: string
  courierProvider?: string
  courierService?: string
  courierTimeframe?: string
  courierBasePrice?: number
  serviceFee?: number
  totalCost?: number
  paidAt?: string
  paymentReference?: string
  dropOffHubAddress?: string
}

export type User = {
  id?: string
  fullName?: string
  email?: string
  role?: string
}

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: string | number
  user: AuthUser
}
