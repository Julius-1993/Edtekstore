import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://edtekstorebackend.onrender.com'
console.log('Using backend URL:', BACKEND_URL)
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  withCredentials: true
})


api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || ''
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register')
    if (err.response?.status === 401 && !isAuth) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api