import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const tokenStore = {
  get accessToken() {
    return localStorage.getItem('accessToken')
  },
  get refreshToken() {
    return localStorage.getItem('refreshToken')
  },
  setSession(session) {
    localStorage.setItem('accessToken', session.accessToken)
    localStorage.setItem('refreshToken', session.refreshToken)
    localStorage.setItem('adminUser', JSON.stringify(session.user))
  },
  clear() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('adminUser')
  },
  getUser() {
    const raw = localStorage.getItem('adminUser')
    return raw ? JSON.parse(raw) : null
  },
}

export const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  if (tokenStore.accessToken) {
    config.headers.Authorization = `Bearer ${tokenStore.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && tokenStore.refreshToken && !original?._retry) {
      original._retry = true
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: tokenStore.refreshToken })
      tokenStore.setSession(response.data.data)
      original.headers.Authorization = `Bearer ${tokenStore.accessToken}`
      return api(original)
    }
    return Promise.reject(error)
  },
)

export async function login(payload) {
  const response = await api.post('/auth/login', payload)
  tokenStore.setSession(response.data.data)
  return response.data.data
}
