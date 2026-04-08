import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import RichMenuList from './views/RichMenuList'
import RichMenuEdit from './views/RichMenuEdit'
import OAManagement from './views/OAManagement'
import PricingPlan from './views/PricingPlan'
import PaymentHistory from './views/PaymentHistory'
import { authApi } from './api/auth'
import { oaApi } from './api/oa'
import { paymentApi } from './api/payment'

const LINE_LOGIN_CHANNEL_ID = import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID || import.meta.env.VITE_LINE_CHANNEL_ID
const LINE_LOGIN_REDIRECT_URI =
  import.meta.env.VITE_LINE_LOGIN_REDIRECT_URI || import.meta.env.VITE_LINE_REDIRECT_URI || `${window.location.origin}/login`
const LINE_LOGIN_STATE_KEY = 'line_login_state'

function textToLogo(name) {
  return (name || 'O').slice(0, 1).toUpperCase()
}

function Header({ dark, onToggleTheme, selectedOaId, onSelectOa, currentUser, onLogout, oaOptions, paymentValidity }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [oaMenuOpen, setOaMenuOpen] = useState(false)
  const avatarMenuRef = useRef(null)
  const oaMenuRef = useRef(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!avatarMenuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
      if (!oaMenuRef.current?.contains(event.target)) {
        setOaMenuOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setOaMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const themeLabel = dark ? '切換為淺色模式' : '切換為深色模式'
  const selectedOa = oaOptions.find((item) => item.id === selectedOaId) || oaOptions[0] || { name: '尚未綁定 OA' }
  const avatarText = currentUser?.name?.slice(0, 1)?.toUpperCase() || 'U'

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link
          to="/richmenu/list"
          className="app-header-title"
          aria-label="前往圖文選單列表"
        >
          圖文選單管理
        </Link>
        <div className="oa-dropdown" ref={oaMenuRef}>
          <button
            type="button"
            className="oa-trigger"
            onClick={() => setOaMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={oaMenuOpen}
            title="切換 OA"
          >
            <span className="oa-logo oa-logo-green oa-logo-sm">
              {selectedOa.pictureUrl ? (
                <img src={selectedOa.pictureUrl} alt={selectedOa.name || 'OA'} className="oa-logo-image" />
              ) : (
                textToLogo(selectedOa.name)
              )}
            </span>
            <span className="oa-trigger-label">{selectedOa.name}</span>
            <span className="oa-trigger-caret">▾</span>
          </button>
          {oaMenuOpen && (
            <div className="oa-dropdown-menu" role="menu">
              {oaOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`oa-dropdown-item ${item.id === selectedOa.id ? 'is-active' : ''}`}
                  onClick={() => {
                    onSelectOa(item.id)
                    setOaMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <span className="oa-logo oa-logo-green oa-logo-sm">
                    {item.pictureUrl ? (
                      <img src={item.pictureUrl} alt={item.name || 'OA'} className="oa-logo-image" />
                    ) : (
                      textToLogo(item.name)
                    )}
                  </span>
                  <span className="oa-dropdown-item-label">{item.name}</span>
                </button>
              ))}
              <Link
                to="/oa-management"
                className="oa-dropdown-item"
                role="menuitem"
                onClick={() => setOaMenuOpen(false)}
              >
                <span className="oa-logo oa-logo-sm oa-logo-blue">管</span>
                <span className="oa-dropdown-item-label">OA 管理</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="app-header-actions">
        {paymentValidity ? (
          paymentValidity.isPaid ? (
            <Link
              to="/pricing"
              className="header-link-btn header-pro-btn"
              title="PRO 已啟用"
              aria-label="PRO 已啟用"
            >
              <span className="pro-icon-circle" aria-hidden="true">
                pro
              </span>
            </Link>
          ) : (
            <Link to="/pricing" className="header-link-btn" title="查看方案">
              付費
            </Link>
          )
        ) : null}
        <div className="avatar-menu" ref={avatarMenuRef}>
          <button
            type="button"
            className="avatar-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="帳號選單"
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="avatar-image" />
            ) : (
              <span className="avatar-fallback">{avatarText}</span>
            )}
          </button>
          {menuOpen && (
            <div className="avatar-dropdown" role="menu">
              <div className="avatar-menu-user">
                <div className="avatar-menu-name">{currentUser?.name || '未登入使用者'}</div>
                <div className="avatar-menu-email">{currentUser?.email || ''}</div>
              </div>
              <Link
                to="/payment-history"
                className="avatar-menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                付費紀錄
              </Link>
              <button
                type="button"
                className="avatar-menu-item"
                onClick={() => {
                  onToggleTheme()
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                {themeLabel}
              </button>
              <button
                type="button"
                className="avatar-menu-item avatar-menu-item-logout"
                onClick={() => {
                  onLogout()
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [loginErrorMessage, setLoginErrorMessage] = useState('')

  const fromPath = location.state?.from?.pathname || '/richmenu/list'

  useEffect(() => {
    const qp = new URLSearchParams(location.search)
    const code = (qp.get('code') || '').trim()
    const callbackState = (qp.get('state') || '').trim()
    if (!code) return

    const expectedState = sessionStorage.getItem(LINE_LOGIN_STATE_KEY) || ''
    // Some browsers / flows may lose sessionStorage during OAuth redirect.
    // Enforce state check only when we still have the expected value locally.
    if (!callbackState || (expectedState && callbackState !== expectedState)) {
      setLoginErrorMessage('LINE 登入驗證失敗，請重新登入')
      return
    }

    let cancelled = false
    const runLogin = async () => {
      setSubmitting(true)
      setLoginErrorMessage('')
      try {
        const res = await authApi.lineLogin(code)
        if (cancelled) return
        onLoginSuccess({
          user: res?.data?.user || null
        })
        sessionStorage.removeItem(LINE_LOGIN_STATE_KEY)
        navigate(fromPath, { replace: true })
      } catch (error) {
        if (cancelled) return
        setLoginErrorMessage(error?.response?.data?.message || 'LINE 登入失敗')
      } finally {
        if (!cancelled) {
          setSubmitting(false)
        }
      }
    }
    runLogin()
    return () => {
      cancelled = true
    }
  }, [location.search, fromPath, navigate, onLoginSuccess])

  const handleLineLogin = () => {
    setLoginErrorMessage('')
    if (!LINE_LOGIN_CHANNEL_ID) {
      setLoginErrorMessage('尚未設定 LINE Channel ID（請設定 VITE_LINE_LOGIN_CHANNEL_ID）')
      return
    }
    const randomState = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(LINE_LOGIN_STATE_KEY, randomState)
    const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', LINE_LOGIN_CHANNEL_ID)
    authUrl.searchParams.set('redirect_uri', LINE_LOGIN_REDIRECT_URI)
    authUrl.searchParams.set('state', randomState)
    authUrl.searchParams.set('scope', 'profile openid email')
    window.location.assign(authUrl.toString())
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>LINE 登入</h1>
        <p className="login-hint">點擊按鈕後，前往 LINE 授權並自動登入。</p>

        {loginErrorMessage ? <div className="login-error">{loginErrorMessage}</div> : null}

        <button type="button" className="btn login-line-btn" onClick={handleLineLogin} disabled={submitting}>
          {submitting ? '登入中...' : '使用 LINE 登入'}
        </button>
      </div>
    </div>
  )
}

function AppRoutes({ selectedOaId, onSelectOa, oaOptions, refreshOaList }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/richmenu/list" replace />} />
      <Route path="/richmenu/list" element={<RichMenuList selectedOaId={selectedOaId} />} />
      <Route path="/richmenu/create" element={<RichMenuEdit selectedOaId={selectedOaId} />} />
      <Route path="/richmenu/edit/:id" element={<RichMenuEdit selectedOaId={selectedOaId} />} />
      <Route
        path="/oa-management"
        element={
          <OAManagement
            selectedOaId={selectedOaId}
            onSelectOa={onSelectOa}
            oaOptions={oaOptions}
            refreshOaList={refreshOaList}
          />
        }
      />
      <Route path="/pricing" element={<PricingPlan selectedOaId={selectedOaId} oaOptions={oaOptions} />} />
      <Route path="/payment-history" element={<PaymentHistory oaOptions={oaOptions} />} />
      <Route path="*" element={<Navigate to="/richmenu/list" replace />} />
    </Routes>
  )
}

export default function App() {
  const [dark, setDark] = useState(true)
  const [selectedOaId, setSelectedOaId] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [oaOptions, setOaOptions] = useState([])
  const [authReady, setAuthReady] = useState(false)
  const [paymentValidity, setPaymentValidity] = useState(null)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark-theme', dark)
  }, [dark])

  const fetchOaList = async () => {
    const res = await oaApi.getList()
    const list = Array.isArray(res?.data) ? res.data : []
    const normalized = list.map((item) => ({
      id: item.oaId,
      name: item.name,
      accountId: item.accountId,
      pictureUrl: item.pictureUrl || '',
      boundAt: item.boundAt,
      status: item.status
    }))
    setOaOptions(normalized)
    if (!normalized.some((item) => item.id === selectedOaId)) {
      setSelectedOaId(normalized[0]?.id || '')
    }
  }

  useEffect(() => {
    if (!currentUser) return
    fetchOaList().catch(() => {
      setOaOptions([])
      setSelectedOaId('')
    })
  }, [currentUser])

  useEffect(() => {
    let cancelled = false
    const loadPaymentValidity = async () => {
      if (!currentUser || !selectedOaId) {
        setPaymentValidity(null)
        return
      }
      try {
        const res = await paymentApi.check({ oaId: selectedOaId })
        if (cancelled) return
        setPaymentValidity(res?.data || null)
      } catch (e) {
        // If check fails, default to "unpaid" so the pay CTA still shows.
        if (cancelled) return
        setPaymentValidity({ isPaid: false })
      }
    }
    loadPaymentValidity()
    return () => {
      cancelled = true
    }
  }, [currentUser, selectedOaId])

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      try {
        const meRes = await authApi.me()
        if (!cancelled) {
          setCurrentUser(meRes?.data?.user || null)
        }
      } catch (meError) {
        try {
          await authApi.refresh()
          const meRes = await authApi.me()
          if (!cancelled) {
            setCurrentUser(meRes?.data?.user || null)
          }
        } catch {
          if (!cancelled) {
            setCurrentUser(null)
          }
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true)
        }
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const onToggleTheme = () => setDark((d) => !d)
  const isAuthed = Boolean(currentUser)
  const handleLoginSuccess = ({ user }) => {
    setCurrentUser(user)
  }
  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // no-op
    }
    setCurrentUser(null)
    setOaOptions([])
    setSelectedOaId('')
    setPaymentValidity(null)
  }

  if (!authReady) return null

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthed ? <Navigate to="/richmenu/list" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="*"
        element={
          isAuthed ? (
            <div className="app-shell">
              <Header
                dark={dark}
                onToggleTheme={onToggleTheme}
                selectedOaId={selectedOaId}
                onSelectOa={setSelectedOaId}
                currentUser={currentUser}
                onLogout={handleLogout}
                oaOptions={oaOptions}
                paymentValidity={paymentValidity}
              />
              <main className="app-main">
                <AppRoutes
                  selectedOaId={selectedOaId}
                  onSelectOa={setSelectedOaId}
                  oaOptions={oaOptions}
                  refreshOaList={fetchOaList}
                />
              </main>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}
