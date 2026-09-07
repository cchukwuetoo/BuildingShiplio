import axios from 'axios'

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
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
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
  getAll: () =>
    api.get('/shipments'),
  getOne: (id: string) =>
    api.get(`/shipments/${id}`),
  cancel: (id: string) =>
    api.patch(`/shipments/${id}/cancel`),
}

export default api
