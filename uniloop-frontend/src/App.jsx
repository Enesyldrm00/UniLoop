import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage         from './pages/AuthPage'
import DashboardPage   from './pages/DashboardPage'
import MessagesPage    from './pages/MessagesPage'
import ProfilePage     from './pages/ProfilePage'
import TasksPage       from './pages/TasksPage'
import UserProfilePage from './pages/UserProfilePage'
import AppLayout       from './components/AppLayout'
import api             from './api/axios'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('uniloop_token'))
  const [user,   setUser]   = useState(null)
  const [wallet, setWallet] = useState(null)

  const handleAuthSuccess = () => {
    setToken(localStorage.getItem('uniloop_token'))
  }

  // Layout için kullanıcı + bakiye çek
  useEffect(() => {
    if (!token) return
    api.get('/wallet/me')
      .then(res => {
        setUser(res.data.user)
        setWallet(res.data.wallet)
      })
      .catch(() => {})

    // Sekmeye dönünce yenile
    const onFocus = () => {
      api.get('/wallet/me')
        .then(res => {
          setUser(res.data.user)
          setWallet(res.data.wallet)
        })
        .catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [token])

  if (!token) {
    return <AuthPage onSuccess={handleAuthSuccess} />
  }

  return (
    <AppLayout user={user} wallet={wallet}>
      <Routes>
        <Route path="/"                  element={<DashboardPage />} />
        <Route path="/tasks"              element={<TasksPage />} />
        <Route path="/messages"           element={<MessagesPage />} />
        <Route path="/profile"            element={<ProfilePage />} />
        <Route path="/profile/:userId"    element={<UserProfilePage />} />
        <Route path="/auth"               element={<Navigate to="/" replace />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

