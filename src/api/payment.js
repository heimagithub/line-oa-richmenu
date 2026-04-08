import request from '../utils/request'

export const paymentApi = {
  createOrder(payload) {
    return request.post('/payments/orders', payload)
  },
  listOrders() {
    return request.get('/payments/orders')
  },
  check(params) {
    return request.get('/payments/check', { params })
  }
}
