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
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
}

export const driversAPI = {
  getShipments: () =>
    api.get('/drivers/shipments'),
  accept: (shipmentId: string) =>
    api.patch(`/drivers/shipments/${shipmentId}/accept`),
  markPickedUp: (shipmentId: string, code: string) =>
    api.patch(`/drivers/shipments/${shipmentId}/pickup`, { code }),
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
  getAll: () =>
    api.get('/shipments'),
  getOne: (id: string) =>
    api.get(`/shipments/${id}`),
  cancel: (id: string) =>
    api.patch(`/shipments/${id}/cancel`),
  getPickupOtp: (id: string) =>
    api.get(`/shipments/${id}/pickup-otp`),
}

export default api
