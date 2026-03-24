import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RichMenuList from './views/RichMenuList'
import RichMenuEdit from './views/RichMenuEdit'

const THEME_STORAGE_KEY = 'line-richmenu-theme'

function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}

function Header({ dark, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onDocClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const themeLabel = dark ? '切換為淺色模式' : '切換為深色模式'

  return (
    <header className="app-header">
      <div className="app-header-title">圖文選單管理</div>
      <div className="app-header-actions">
        <div className="settings-menu" ref={menuRef}>
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="設定"
          >
            ⚙
          </button>
          {menuOpen && (
            <div className="settings-dropdown" role="menu">
              <button
                type="button"
                className="settings-item"
                onClick={() => {
                  onToggleTheme()
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                {themeLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => readStoredTheme() === 'dark')

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark-theme', dark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  const onToggleTheme = () => setDark((d) => !d)

  return (
    <div className="app-shell">
      <Header dark={dark} onToggleTheme={onToggleTheme} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/richmenu/list" replace />} />
          <Route path="/richmenu/list" element={<RichMenuList />} />
          <Route path="/richmenu/create" element={<RichMenuEdit />} />
          <Route path="/richmenu/edit/:id" element={<RichMenuEdit />} />
        </Routes>
      </main>
    </div>
  )
}
