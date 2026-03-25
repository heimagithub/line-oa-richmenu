import axios from 'axios'

const defaultApiBaseUrl = 'https://26tif7inm6.execute-api.ap-northeast-1.amazonaws.com/api/v1'

const instance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, ''),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

function isExpectedUnauthenticatedAuthProbe(error) {
  if (error.response?.status !== 401) return false
  const url = error.config?.url || ''
  return url.includes('/auth/me') || url.includes('/auth/refresh')
}

instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const quiet401 = isExpectedUnauthenticatedAuthProbe(error)
    if (!quiet401) {
      console.error('API Error:', error)
    }
    if (error.response && !quiet401) {
      switch (error.response.status) {
        case 401:
          console.error('未授權')
          break
        case 403:
          console.error('無權限')
          break
        case 404:
          console.error('找不到資源')
          break
        case 500:
          console.error('伺服器錯誤')
          break
      }
    }
    return Promise.reject(error)
  }
)

export default instance
