import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { ProtectedRoute } from '../../features/auth/session/ProtectedRoute'
import { AuthenticatedLayout } from '../layout/AuthenticatedLayout'
import { HomePage } from '../../pages/HomePage'
import { ContactsPage } from '../../pages/ContactsPage'
import { AnnouncementsPage } from '../../pages/AnnouncementsPage'
import { FilesPage } from '../../pages/FilesPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ErrorPage } from '../../pages/ErrorPage'

export const router = createBrowserRouter([
  {
    // Ruta raíz sin path: solo aloja el errorElement global; sin `element` propio, React Router renderiza <Outlet/> por defecto.
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <HomePage /> },
          { path: 'contactos', element: <ContactsPage /> },
          { path: 'comunicados', element: <AnnouncementsPage /> },
          { path: 'archivos', element: <FilesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
