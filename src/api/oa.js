import request from '../utils/request'

export const oaApi = {
  async getList() {
    return request.get('/oa')
  },
  async create(payload) {
    return request.post('/oa', payload)
  },
  async updateToken(oaId, payload) {
    return request.put(`/oa/${oaId}/token`, payload)
  },
  async remove(oaId) {
    return request.delete(`/oa/${oaId}`)
  }
}
