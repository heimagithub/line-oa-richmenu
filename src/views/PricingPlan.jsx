import { useEffect, useMemo, useState } from 'react'
import { paymentApi } from '../api/payment'

const PLANS = [
  { billingCycle: 'monthly',  months: 1,  total: 199,  perMonth: 199, label: '1 個月',  discountPct: 0  },
  { billingCycle: '3months',  months: 3,  total: 549,  perMonth: 183, label: '3 個月',  discountPct: 8  },
  { billingCycle: '6months',  months: 6,  total: 999,  perMonth: 167, label: '6 個月',  discountPct: 16 },
  { billingCycle: 'yearly',   months: 12, total: 1790, perMonth: 149, label: '12 個月', discountPct: 25, featured: true },
]

function formatPrice(value) {
  return new Intl.NumberFormat('zh-TW').format(value)
}

export default function PricingPlan({ selectedOaId, oaOptions }) {
  const [selected, setSelected] = useState('yearly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentValidity, setPaymentValidity] = useState(null)

  const currentOaName = useMemo(() => {
    if (!selectedOaId) return ''
    return oaOptions?.find((item) => item.id === selectedOaId)?.name || selectedOaId
  }, [oaOptions, selectedOaId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selectedOaId) {
        if (!cancelled) setPaymentValidity(null)
        return
      }
      try {
        const res = await paymentApi.check({ oaId: selectedOaId })
        if (!cancelled) setPaymentValidity(res?.data || null)
      } catch {
        if (!cancelled) setPaymentValidity({ isPaid: false })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedOaId])

  const handleCheckout = async () => {
    if (!selectedOaId) {
      window.alert('請先建立或選擇一個 LINE OA')
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await paymentApi.createOrder({ oaId: selectedOaId, billingCycle: selected })
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

  const selectedPlan = PLANS.find((p) => p.billingCycle === selected) || PLANS[3]

  return (
    <div className="pricing-content">
      <div className="pricing-oa-hint">
        {selectedOaId ? (
          <>
            升級 OA：<strong>{currentOaName}</strong>
          </>
        ) : (
          '請先建立或選擇一個 LINE OA'
        )}
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <button
            key={plan.billingCycle}
            type="button"
            className={`pricing-plan-card${plan.featured ? ' is-featured' : ''}${selected === plan.billingCycle ? ' is-selected' : ''}`}
            onClick={() => setSelected(plan.billingCycle)}
          >
            {plan.featured && <span className="pricing-featured-badge">最划算</span>}
            <div className="pricing-plan-duration">{plan.label}</div>
            <div className="pricing-plan-price">
              <span className="pricing-plan-currency">NT</span>
              <span className="pricing-plan-amount">{formatPrice(plan.total)}</span>
            </div>
            <div className="pricing-plan-per-month">約 NT{plan.perMonth}／月</div>
            <div className="pricing-plan-discount-area">
              {plan.discountPct === 0 ? (
                <span className="pricing-standard-label">標準定價</span>
              ) : (
                <span className="pricing-discount-badge">省 {plan.discountPct}%</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pricing-linepay-btn"
        onClick={handleCheckout}
        disabled={!selectedOaId || paymentValidity?.isPaid || checkoutLoading}
      >
        {paymentValidity?.isPaid
          ? '目前使用方案'
          : checkoutLoading
            ? '建立訂單中…'
            : `使用 LINE Pay 付費（NT$${formatPrice(selectedPlan.total)}）`}
      </button>

      {paymentValidity?.isPaid && (
        <p className="pricing-paid-hint">此 OA 目前已啟用付費方案</p>
      )}
    </div>
  )
}
