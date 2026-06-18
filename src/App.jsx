import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoadingSpinner } from './components/shared'
import Layout from './components/shared/Layout'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import StockListPage from './pages/StockListPage'
import AddStockPage from './pages/AddStockPage'
import EditStockPage from './pages/EditStockPage'
import StockDetailPage from './pages/StockDetailPage'
import RequestListPage from './pages/RequestListPage'
import CreateRequestPage from './pages/CreateRequestPage'
import EditRequestPage from './pages/EditRequestPage'
import RequestDetailPage from './pages/RequestDetailPage'
import DeliveryListPage from './pages/DeliveryListPage'
import ConfirmDeliveryPage from './pages/ConfirmDeliveryPage'
import UsersPage from './pages/UsersPage'
import WaybillPage from './pages/WaybillPage'
import ChangePasswordPage from './pages/ChangePasswordPage'

const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  return (
    <Routes>
      <Route path="/login"                   element={<LoginPage />} />
      <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token"   element={<ResetPasswordPage />} />
      <Route path="/confirm-delivery/:token" element={<ConfirmDeliveryPage />} />
      <Route path="/waybill/:token" element={<WaybillPage />} />
      <Route path="/change-password" element={<Guard><ChangePasswordPage /></Guard>} />

      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<Guard roles={['admin']}><UsersPage /></Guard>} />
        <Route path="stock" element={<StockListPage />} />
        <Route path="stock/add"      element={<Guard roles={['storekeeper','admin']}><AddStockPage /></Guard>} />
        <Route path="stock/:id"      element={<StockDetailPage />} />
        <Route path="stock/:id/edit" element={<Guard roles={['storekeeper','admin']}><EditStockPage /></Guard>} />
        <Route path="requests" element={<RequestListPage />} />
        <Route path="requests/create"  element={<Guard roles={['sales','admin']}><CreateRequestPage /></Guard>} />
        <Route path="requests/:id"     element={<RequestDetailPage />} />
        <Route path="requests/:id/edit" element={<Guard roles={['sales','admin']}><EditRequestPage /></Guard>} />
        <Route path="deliveries" element={<Guard roles={['storekeeper','technical','admin']}><DeliveryListPage /></Guard>} />
      </Route>
    </Routes>
  )
}
