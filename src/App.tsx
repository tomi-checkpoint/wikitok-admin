import { useState, useEffect, useCallback } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Layout from './components/Layout'
import Toast, { useToast } from './components/Toast'

type Page = 'dashboard' | 'users'

function isLoggedIn(): boolean {
  try {
    const auth = localStorage.getItem('wikitok_admin_auth')
    if (!auth) return false
    const parsed = JSON.parse(auth)
    return parsed.email === 'noah@checkpointgtm.com'
  } catch {
    return false
  }
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { toasts, addToast, dismissToast } = useToast()

  const handleLogin = () => {
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('wikitok_admin_auth')
    setAuthenticated(false)
    setCurrentPage('dashboard')
  }

  const handleToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    addToast(type, text)
  }, [addToast])

  if (!authenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'users' && <Users onToast={handleToast} />}
      </Layout>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
