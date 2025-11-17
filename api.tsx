import axios from 'axios'

const base_url = "https://www.timeerp.duckdns.org"

const api = axios.create({
  baseURL: base_url,
  // withCredentials: true,
})

// ✅ Add the JWT token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `JWT ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
