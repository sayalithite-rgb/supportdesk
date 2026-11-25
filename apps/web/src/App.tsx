import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TicketsPage = lazy(() => import('./pages/TicketsPage'))
const NewTicketPage = lazy(() => import('./pages/NewTicketPage'))
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'))
const MyWorkPage = lazy(() => import('./pages/MyWorkPage'))

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-amz-bg" role="status">
          <span className="sr-only">Loading page</span>
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-amz-border border-t-amz-orange" />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/my-work" element={<MyWorkPage />} />
            <Route path="/tickets/new" element={<NewTicketPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}