import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute – wraps a route to enforce authentication and optional roles.
 * Usage: <ProtectedRoute allowedRoles={['admin', 'captain']}><AdminPage /></ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth()

    if (loading) return <div className="loading-screen"><div className="spinner" /></div>
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />
    }
    return children
}

export default ProtectedRoute
