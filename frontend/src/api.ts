import axios from 'axios'
import type { LoginResponse } from './types.js'

const API_URL = 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  register: (data: {
    fullName: string
    email: string
    password: string
    confirmPassword: string
  }) => api.post('/auth/register', data),
  verifyOtp: (email: string, otpCode: string, purpose: string) =>
    api.post('/auth/verify-otp', { email, otpCode, purpose }),
  resendOtp: (email: string, purpose: string) =>
    api.post('/auth/resend-otp', { email, purpose }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: {
    email: string
    otpCode: string
    newPassword: string
    confirmPassword: string
  }) => api.post('/auth/reset-password', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
}

export const driversAPI = {
  getShipments: () =>
    api.get('/drivers/shipments'),
  accept: (shipmentId: string) =>
    api.patch(`/drivers/shipments/${shipmentId}/accept`),
  markPickedUp: (shipmentId: string) =>
    api.patch(`/drivers/shipments/${shipmentId}/pickup`),
}

export const warehouseAPI = {
  getShipments: () =>
    api.get('/warehouse/shipments'),
  receive: (shipmentId: string) =>
    api.patch(`/warehouse/shipments/${shipmentId}/receive`),
  startProcessing: (shipmentId: string) =>
    api.patch(`/warehouse/shipments/${shipmentId}/process`),
  markReady: (shipmentId: string) =>
    api.patch(`/warehouse/shipments/${shipmentId}/ready`),
}

export const shipmentsAPI = {
  create: (data: any) =>
    api.post('/shipments', data),
  getAll: (page = 1, limit = 50) =>
    api.get('/shipments', { params: { page, limit } }),
  getOne: (id: string) =>
    api.get(`/shipments/${id}`),
  cancel: (id: string) =>
    api.patch(`/shipments/${id}/cancel`),
  getRates: (data: any) =>
    api.post('/shipments/rates', data),
  confirmPayment: (id: string, paymentReference?: string) =>
    api.patch(`/shipments/${id}/confirm-payment`, { paymentReference }),
  getPickupCode: (id: string) =>
    api.get(`/shipments/${id}/pickup-code`),
}

export default api
