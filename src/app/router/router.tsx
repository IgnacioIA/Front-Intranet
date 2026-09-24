import { createBrowserRouter } from 'react-router-dom'
import App from '../../App'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { ProtectedRoute } from '../../features/auth/session/ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
])
