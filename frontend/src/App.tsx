import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'

// Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ClassesListPage } from './pages/classes/ClassesListPage'
import { ClassDetailPage } from './pages/classes/ClassDetailPage'
import { NoticesPage } from './pages/notices/NoticesPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { GradesAttendancePage } from './pages/grades-attendance/GradesAttendancePage'
import { AssignmentsPage } from './pages/assignments/AssignmentsPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { UsersManagementPage } from './pages/admin/UsersManagementPage'
import { DisciplinesManagementPage } from './pages/admin/DisciplinesManagementPage'
import { TeachersManagementPage } from './pages/admin/TeachersManagementPage'
import { StudentsManagementPage } from './pages/admin/StudentsManagementPage'
import { EnrollmentsManagementPage } from './pages/admin/EnrollmentsManagementPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { EmptyState } from './components/common/EmptyState'
import { ShieldAlert } from 'lucide-react'

// Admin Guard component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return (
      <div className="py-12">
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-rose-500" />}
          title="Acesso Negado à Área Administrativa"
          description="Esta seção é estritamente restrita aos administradores do sistema."
        />
      </div>
    )
  }

  return <>{children}</>
}

// Public Route Guard (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected App Layout Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="classes" element={<ClassesListPage />} />
              <Route path="classes/:id" element={<ClassDetailPage />} />
              <Route path="notices" element={<NoticesPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="grades-attendance" element={<GradesAttendancePage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin Routes */}
              <Route
                path="admin/users"
                element={
                  <AdminRoute>
                    <UsersManagementPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/disciplines"
                element={
                  <AdminRoute>
                    <DisciplinesManagementPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/teachers"
                element={
                  <AdminRoute>
                    <TeachersManagementPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <AdminRoute>
                    <StudentsManagementPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/enrollments"
                element={
                  <AdminRoute>
                    <EnrollmentsManagementPage />
                  </AdminRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
