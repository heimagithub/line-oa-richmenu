import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    if (error.response) {
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
