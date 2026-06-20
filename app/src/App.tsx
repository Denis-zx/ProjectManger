import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import TeamKanban from './pages/TeamKanban'
import PersonalKanban from './pages/PersonalKanban'
import ManagementDashboard from './pages/ManagementDashboard'
import ProjectDetail from './pages/ProjectDetail'
import ProjectCreate from './pages/ProjectCreate'
import ReserveProjects from './pages/ReserveProjects'
import SystemAdmin from './pages/SystemAdmin'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated, restoreSession } = useAuthStore()
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    restoreSession().finally(() => setRestored(true))
  }, [])

  if (!restored) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/team-kanban" replace />} />
        <Route path="team-kanban" element={<TeamKanban />} />
        <Route path="personal-kanban" element={<PersonalKanban />} />
        <Route path="management-dashboard" element={<ManagementDashboard />} />
        <Route path="system-admin" element={<SystemAdmin />} />
        <Route path="project/create" element={<ProjectCreate />} />
        <Route path="project/:id" element={<ProjectDetail />} />
        <Route path="reserve-projects" element={<ReserveProjects />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
