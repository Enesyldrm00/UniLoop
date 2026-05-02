import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage      from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  // Token yoksa auth sayfasına at
  const [token, setToken] = useState(() => localStorage.getItem('uniloop_token'))

  const handleAuthSuccess = () => {
    setToken(localStorage.getItem('uniloop_token'))
  }

  if (!token) {
    return <AuthPage onSuccess={handleAuthSuccess} />
  }

  return (
    <Routes>
      <Route path="/"       element={<DashboardPage />} />
      <Route path="/auth"   element={<Navigate to="/" replace />} />
      {/* Diğer sayfalar buraya eklenir */}
      <Route path="*"       element={<Navigate to="/" replace />} />
    </Routes>
  )
}
