import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// İstek öncesi: JWT token'ı otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uniloop_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Yanıt sonrası: 401 → login sayfasına yönlendir
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('uniloop_token')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default api
