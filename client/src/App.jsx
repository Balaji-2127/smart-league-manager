import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './router/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import Matches from './pages/Matches'
import LiveScore from './pages/LiveScore'
import Leaderboard from './pages/Leaderboard'
import TeamManagement from './pages/TeamManagement'
import PlayerProfile from './pages/PlayerProfile'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="app-layout">
      {isAuthenticated && <Navbar />}
      <div className={isAuthenticated ? 'main-content' : ''}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/match/:id/live" element={<ProtectedRoute><LiveScore /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute allowedRoles={['admin', 'captain']}><TeamManagement /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
