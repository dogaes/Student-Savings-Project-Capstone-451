import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import BudgetPage from './pages/BudgetPage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'
import LoansPage from './pages/LoansPage.jsx'
import GoalsPage from './pages/GoalsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
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
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
