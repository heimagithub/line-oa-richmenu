import request from '../utils/request'

function normalizeRichMenuRecord(record) {
  const imageUrl = record.imageUrl || record.image_url || record.preview_url || ''
  return {
    ...record,
    imageUrl,
    image_url: imageUrl,
    preview_url: imageUrl,
    updatedAt: record.updatedAt || record.updated_at || '',
    updated_at: record.updated_at || record.updatedAt || '',
    status: record.status || 'draft',
    isDefault: Boolean(record.isDefault || record.is_default || record.default),
    is_default: Boolean(record.isDefault || record.is_default || record.default),
    oaId: record.oaId || record.oa_id || ''
  }
}

export const richMenuApi = {
  async getList(params = {}) {
    const response = await request.get('/richmenus', { params })
    return {
      ...response,
      data: Array.isArray(response?.data) ? response.data.map(normalizeRichMenuRecord) : []
    }
  },

  async getRichMenu(id, params = {}) {
    const response = await request.get(`/richmenus/${id}`, { params })
    return { ...response, data: normalizeRichMenuRecord(response?.data || {}) }
  },

  async createRichMenu(data) {
    return request.post('/richmenus', data)
  },

  async updateRichMenu(id, data, params = {}) {
    return request.put(`/richmenus/${id}`, { ...data, ...params })
  },

  async deleteRichMenu(id, params = {}) {
    return request.delete(`/richmenus/${id}`, { params })
  },

  async getRichMenuStatus(id, params = {}) {
    return request.get(`/richmenus/${id}/status`, { params })
  },

  async publishRichMenu(id, data = {}) {
    return request.post(`/richmenus/${id}/publish`, data)
  },

  async unlinkRichMenu(data) {
    return request.post('/richmenus/unlink-default', data)
  },

  async closeAllRichMenu(data) {
    return request.post('/richmenus/close-all', data)
  },

  async bulkDeleteRichMenu(data) {
    return request.post('/richmenus/bulk-delete', data)
  },

  async removeAllLineRichMenu(data) {
    return request.post('/richmenus/remove-all-line', data)
  },

  async removeAllRichMenu(params = {}) {
    return request.delete('/richmenus', { params })
  },

  async uploadImage(data) {
    return request.post('/files/richmenu-image', data)
  }
}
