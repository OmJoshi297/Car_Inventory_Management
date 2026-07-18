import axios from 'axios'

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT token from localStorage to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 response, clear auth and redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export const vehiclesAPI = {
  list: () => client.get('/vehicles'),
  search: (params) => client.get('/vehicles/search', { params }),
  create: (data) => client.post('/vehicles', data),
  update: (id, data) => client.put(`/vehicles/${id}`, data),
  delete: (id) => client.delete(`/vehicles/${id}`),
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryAPI = {
  purchase: (id, quantity = 1) => client.post(`/vehicles/${id}/purchase`, { quantity }),
  restock: (id, quantity) => client.post(`/vehicles/${id}/restock`, { quantity }),
  getPurchasesLogs: () => client.get('/vehicles/purchases/logs'),
}

export default client
