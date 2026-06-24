import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../../ui/components/layout/AppLayout'
import LoginPage from '../../ui/pages/LoginPage'
import RegisterPage from '../../ui/pages/RegisterPage'
import LearningPage from '../../ui/pages/LearningPage'
import ProgressPage from '../../ui/pages/ProgressPage'
import DuelsPage from '../../ui/pages/DuelsPage'
import FriendsPage from '../../ui/pages/FriendsPage'
import ProfilePage from '../../ui/pages/ProfilePage'

// Защищённый роут — редиректит на логин если нет токена
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

// Публичный роут — редиректит на главную если уже залогинен
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />
        <Route path="/" element={
          <PrivateRoute><AppLayout /></PrivateRoute>
        }>
          <Route index element={<LearningPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="duels" element={<DuelsPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}