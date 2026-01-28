import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignUpPage } from './pages/Auth/SignUpPage';
import { CustomerApprovalPage } from './pages/Public/CustomerApprovalPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { CustomerDetailPage } from './pages/Customers/CustomerDetailPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { PartsPage } from './pages/Parts/PartsPage';
import { RvDetailPage } from './pages/RVs/RvDetailPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { NewWorkOrderPage } from './pages/WorkOrders/NewWorkOrderPage';
import { WorkOrderDetailPage } from './pages/WorkOrders/WorkOrderDetailPage';
import { ReportsPage } from './pages/Reports/ReportsPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/approve/:token" element={<CustomerApprovalPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="/rvs/:rvId" element={<RvDetailPage />} />
        <Route path="/rvs/:rvId/work-orders/new" element={<NewWorkOrderPage />} />
        <Route path="/work-orders/:workOrderId" element={<WorkOrderDetailPage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
