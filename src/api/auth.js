import request from '../utils/request'

export const authApi = {
  async lineLogin(code) {
    return request.post('/auth/line-login', { code })
  },
  async me() {
    return request.get('/auth/me')
  },
  async refresh() {
    return request.post('/auth/refresh')
  },
  async logout() {
    return request.post('/auth/logout')
  }
}
