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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google)
  }
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-identity]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google))
      existingScript.addEventListener('error', () => reject(new Error('Google SDK 載入失敗')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Google SDK 載入失敗'))
    document.head.appendChild(script)
  })
}

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
  const [account, setAccount] = useState('heima@gmail.com')
  const [password, setPassword] = useState('stock168')
  const [submitting, setSubmitting] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(true)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginErrorMessage, setLoginErrorMessage] = useState('')
  const [registerErrorMessage, setRegisterErrorMessage] = useState('')
  const [registerNoticeMessage, setRegisterNoticeMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const fromPath = location.state?.from?.pathname || '/richmenu/list'

  const handleAccountLogin = async (event) => {
    event.preventDefault()
    setLoginErrorMessage('')
    if (!account.trim() || !password.trim()) {
      setLoginErrorMessage('請輸入帳號與密碼')
      return
    }
    setSubmitting(true)
    try {
      const res = await authApi.login({ email: account.trim(), password: password.trim() })
      onLoginSuccess({
        user: res?.data?.user || null
      })
      navigate(fromPath, { replace: true })
    } catch (error) {
      setLoginErrorMessage(error?.response?.data?.message || '登入失敗')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setRegisterErrorMessage('')
    setRegisterNoticeMessage('')
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setRegisterErrorMessage('註冊請輸入姓名、信箱與密碼')
      return
    }
    if (!registerEmail.includes('@')) {
      setRegisterErrorMessage('請輸入正確的信箱格式')
      return
    }
    setSubmitting(true)
    try {
      await authApi.register({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword.trim(),
        confirmPassword: registerPassword.trim()
      })
      setAccount(registerEmail.trim())
      setPassword('')
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterNoticeMessage('註冊完成，請使用剛建立的帳號登入')
      setTimeout(() => {
        setIsRegisterOpen(false)
        setIsLoginOpen(true)
        setRegisterNoticeMessage('')
      }, 1000)
    } catch (error) {
      setRegisterErrorMessage(error?.response?.data?.message || '註冊失敗')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoginErrorMessage('')
    if (!GOOGLE_CLIENT_ID) {
      setLoginErrorMessage('尚未設定 Google Client ID，請先設定 VITE_GOOGLE_CLIENT_ID')
      return
    }
    setIsGoogleLoading(true)
    try {
      const google = await loadGoogleIdentityScript()
      if (!google?.accounts?.oauth2) {
        throw new Error('Google OAuth 初始化失敗')
      }
      const tokenResponse = await new Promise((resolve, reject) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: (response) => {
            if (response?.error) {
              reject(new Error(response.error))
              return
            }
            resolve(response)
          }
        })
        tokenClient.requestAccessToken({ prompt: 'consent' })
      })
      const accessToken = tokenResponse?.access_token
      if (!accessToken) {
        throw new Error('未取得 Google Access Token')
      }
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!profileRes.ok) {
        throw new Error('讀取 Google 使用者資料失敗')
      }
      const profile = await profileRes.json()
      const googleEmail = profile.email || ''
      const googleName = profile.name || profile.email || 'Google User'
      const googlePassword = `Google_${profile.sub || Date.now()}!`
      await authApi.register({
        name: googleName,
        email: googleEmail,
        password: googlePassword,
        confirmPassword: googlePassword
      }).catch(() => null)
      const res = await authApi.login({
        email: googleEmail,
        password: googlePassword
      })
      onLoginSuccess({
        user: { ...(res?.data?.user || {}), avatarUrl: profile.picture || '' }
      })
      navigate(fromPath, { replace: true })
    } catch (error) {
      setLoginErrorMessage(error?.message || 'Google 登入失敗')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="login-shell">
      {isLoginOpen ? (
        <div className="login-card">
          <h1>登入</h1>
          <p className="login-hint">請使用帳號密碼登入。</p>
          <form onSubmit={handleAccountLogin} className="login-form">
            <label htmlFor="login-account">帳號</label>
            <input
              id="login-account"
              type="text"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              placeholder="請輸入帳號或 Email"
              autoComplete="username"
            />

            <label htmlFor="login-password">密碼</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="請輸入密碼"
              autoComplete="current-password"
            />

            <div className="login-register-entry">
              <button
                type="button"
                className="login-register-link"
                onClick={() => {
                  setLoginErrorMessage('')
                  setRegisterErrorMessage('')
                  setRegisterNoticeMessage('')
                  setIsLoginOpen(false)
                  setIsRegisterOpen(true)
                }}
              >
                註冊
              </button>
            </div>

            {loginErrorMessage ? <div className="login-error">{loginErrorMessage}</div> : null}

            <button type="submit" className="btn btn-success login-submit-btn">
              {submitting ? '登入中...' : '登入'}
            </button>
          </form>

          {/* 暫時隱藏 Google 登入入口 */}
        </div>
      ) : null}
      {isRegisterOpen ? (
        <div
          className="register-dialog-backdrop"
          role="presentation"
          onClick={() => {
            setRegisterErrorMessage('')
            setRegisterNoticeMessage('')
            setIsRegisterOpen(false)
            setIsLoginOpen(true)
          }}
        >
          <div className="register-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>註冊</h2>
            <form onSubmit={handleRegister} className="login-form">
              <label htmlFor="register-name">姓名</label>
              <input
                id="register-name"
                type="text"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="請輸入姓名"
              />
              <label htmlFor="register-email">信箱</label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="請輸入信箱"
                autoComplete="email"
              />

              <label htmlFor="register-password">密碼</label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="請輸入密碼"
                autoComplete="new-password"
              />

              {registerNoticeMessage ? <div className="login-notice">{registerNoticeMessage}</div> : null}
              {registerErrorMessage ? <div className="login-error">{registerErrorMessage}</div> : null}

              <div className="register-dialog-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setRegisterErrorMessage('')
                    setRegisterNoticeMessage('')
                    setIsRegisterOpen(false)
                    setIsLoginOpen(true)
                  }}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '處理中...' : '完成註冊'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
      <Route path="/pricing" element={<PricingPlan />} />
      <Route path="/payment-history" element={<PaymentHistory />} />
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
      if (!currentUser) {
        setPaymentValidity(null)
        return
      }
      try {
        const res = await paymentApi.check()
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
  }, [currentUser])

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
