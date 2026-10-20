import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Every page inside here requires sign-in and shares the top navigation. */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/budget" element={<ComingSoonPage title="Budget" />} />
        <Route path="/accounts" element={<ComingSoonPage title="Accounts" />} />
        <Route path="/loans" element={<ComingSoonPage title="Loans" />} />
        <Route path="/goals" element={<ComingSoonPage title="Goals" />} />
        <Route path="/assistant" element={<ComingSoonPage title="AI Assistant" />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
