import { Navigate, useLocation } from 'react-router-dom'
import { tokenStore } from '../services/api'

export function RequireAuth({ children }) {
  const location = useLocation()
  if (!tokenStore.accessToken) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
