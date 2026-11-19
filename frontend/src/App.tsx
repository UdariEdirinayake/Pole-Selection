import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProjectProvider } from './context/ProjectContext'
import { AppLayout } from './layouts/AppLayout'
import { SignInPage } from './pages/SignInPage'
import { HomePage, AboutPage, HelpPage } from './pages/PublicPages'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectCircuitsPage } from './pages/ProjectCircuitsPage'
import { RoutePolesPage } from './pages/RoutePolesPage'
import { ReviewRunPage } from './pages/ReviewRunPage'
import { ResultsPage } from './pages/ResultsPage'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading session...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* Authenticated Application Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/project-circuits" element={<ProjectCircuitsPage />} />
                <Route path="/route-poles" element={<RoutePolesPage />} />
                <Route path="/review-run" element={<ReviewRunPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
