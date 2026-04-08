import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { paymentApi } from '../api/payment'

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-TW')
}

function statusLabel(status) {
  if (status === 'paid') return '已付款'
  if (status === 'pending') return '未付款'
  if (status === 'failed') return '失敗'
  return status || '—'
}

export default function PaymentHistory({ oaOptions }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await paymentApi.listOrders()
      const list = Array.isArray(res?.data) ? res.data : []
      setOrders(list)
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.message || '載入失敗')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="panel payment-history-page">
      <div className="page-head payment-history-head">
        <h2>付費紀錄</h2>
        <div className="payment-history-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={load} disabled={loading}>
            {loading ? '更新中…' : '重新整理'}
          </button>
          <Link to="/pricing" className="header-link-btn">
            前往方案付費
          </Link>
        </div>
      </div>

      {error ? <div className="login-error payment-history-error">{error}</div> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>方案</th>
              <th>所屬 OA</th>
              <th>週期</th>
              <th>金額</th>
              <th>狀態</th>
              <th>付款(開始)時間</th>
              <th>方案結束時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  載入中…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  尚無付費紀錄
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.orderId}>
                  <td className="payment-order-id">{order.orderId}</td>
                  <td>{order.planName || order.productName || '—'}</td>
                  <td>{oaOptions?.find((item) => item.id === order.oaId)?.name || order.oaId || '—'}</td>
                  <td>{order.billingCycle === 'yearly' ? '年繳' : order.billingCycle === 'monthly' ? '月繳' : order.billingCycle || '—'}</td>
                  <td>
                    NT${' '}
                    {typeof order.amount === 'number' ? order.amount.toLocaleString('zh-TW') : order.amount}
                    {order.currency ? ` ${order.currency}` : ''}
                  </td>
                  <td>
                    <span className={`payment-status payment-status--${order.status || 'unknown'}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(order.paidAt)}</td>
                  <td>{formatDateTime(order.planEndAt)}</td>
                  <td className="actions">
                    {order.status === 'pending' && order.paymentUrl ? (
                      <a href={order.paymentUrl} className="payment-pay-link" rel="noopener noreferrer">
                        前往付費
                      </a>
                    ) : (
                      <span className="payment-no-action">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
