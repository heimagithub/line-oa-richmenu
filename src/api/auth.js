import request from '../utils/request'

export const authApi = {
  async login(payload) {
    return request.post('/auth/login', payload)
  },
  async me() {
    return request.get('/auth/me')
  },
  async refresh() {
    return request.post('/auth/refresh')
  },
  async register(payload) {
    return request.post('/auth/register', payload)
  },
  async logout() {
    return request.post('/auth/logout')
  }
}
