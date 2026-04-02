import { useEffect, useMemo, useState } from 'react'
import { paymentApi } from '../api/payment'

const MONTHLY_PRICE = 600
const YEARLY_PRICE = 300 * 12

function formatPrice(value) {
  return new Intl.NumberFormat('zh-TW').format(value)
}

export default function PricingPlan() {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentValidity, setPaymentValidity] = useState(null)

  const plan = useMemo(() => {
    const isYearly = billingCycle === 'yearly'
    const price = isYearly ? YEARLY_PRICE : MONTHLY_PRICE
    const unitLabel = isYearly ? '/ 年' : '/ 月'
    const description = isYearly ? '年繳方案（一次扣款）' : '月繳方案'

    return {
      name: 'pro',
      description,
      price,
      unitLabel
    }
  }, [billingCycle])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await paymentApi.check()
        if (!cancelled) setPaymentValidity(res?.data || null)
      } catch {
        if (!cancelled) setPaymentValidity({ isPaid: false })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLinePayCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await paymentApi.createOrder({ billingCycle })
      const paymentUrl = res?.data?.paymentUrl
      if (!paymentUrl) {
        window.alert('無法取得付款連結，請稍後再試。')
        return
      }
      window.location.href = paymentUrl
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.message || '建立訂單失敗'
      window.alert(msg)
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <section className="panel pricing-page">
      <div className="page-head pricing-page-head">
        <h2>方案與付費</h2>
      </div>

      <article className="pricing-card">
        <div className="pricing-card-head">
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
        </div>

        <div className="pricing-price-row">
          <div className="pricing-currency">NT$</div>
          <div className="pricing-amount">{formatPrice(plan.price)}</div>
          <div className="pricing-unit">{plan.unitLabel}</div>
        </div>

        <div className="pricing-cycle-toggle" role="group" aria-label="付費週期切換">
          <button
            type="button"
            className={`pricing-cycle-btn ${billingCycle === 'monthly' ? 'is-active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            月繳
          </button>
          <button
            type="button"
            className={`pricing-cycle-btn ${billingCycle === 'yearly' ? 'is-active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            年繳
            <span className="pricing-off-badge">50% OFF</span>
          </button>
        </div>

        <div className="pricing-summary">
          {billingCycle === 'yearly' ? '年付金額：NT$3,600（300 x 12）' : '月付金額：NT$600'}
        </div>

        <button
          type="button"
          className="pricing-linepay-btn"
          onClick={handleLinePayCheckout}
          disabled={paymentValidity?.isPaid || checkoutLoading}
        >
          {paymentValidity?.isPaid ? '目前使用方案' : checkoutLoading ? '建立訂單中…' : '使用 LINE Pay 付費'}
        </button>
      </article>
    </section>
  )
}
