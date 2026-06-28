import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../../ui/components/layout/AppLayout'
import LoginPage from '../../ui/pages/LoginPage'
import RegisterPage from '../../ui/pages/RegisterPage'
import LearningPage from '../../ui/pages/LearningPage'
import ProgressPage from '../../ui/pages/ProgressPage'
import DuelsPage from '../../ui/pages/DuelsPage'
import DuelPage from '../../ui/pages/DuelPage'
import FriendsPage from '../../ui/pages/FriendsPage'
import ProfilePage from '../../ui/pages/ProfilePage'
import SessionPage from '../../ui/pages/SessionPage'
import LeaderboardPage from '../../ui/pages/LeaderboardPage'

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return null
    return user ? children : <Navigate to="/login" replace />
}

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

                {/* Сессия — без таббара */}
                <Route path="/session" element={
                    <PrivateRoute><SessionPage /></PrivateRoute>
                } />

                {/* Основные страницы с таббаром */}
                <Route path="/" element={
                    <PrivateRoute><AppLayout /></PrivateRoute>
                }>
                    <Route path="/duel" element={
                        <PrivateRoute><DuelPage /></PrivateRoute>
                    } />
                    <Route index element={<LearningPage />} />
                    <Route path="progress" element={<ProgressPage />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="duels" element={<DuelsPage />} />
                    <Route path="friends" element={<FriendsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}