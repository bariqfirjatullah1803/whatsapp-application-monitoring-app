import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { UsersPage } from '@/pages/UsersPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// Route untuk customer_service (chat dashboard)
function CustomerServiceRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Admin dan leader redirect ke users
  if (user?.role === 'admin' || user?.role === 'leader') {
    return <Navigate to="/users" replace />;
  }

  return <>{children}</>;
}

// Route untuk admin dan leader (user management)
function AdminLeaderRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Customer service redirect ke dashboard
  if (user?.role === 'customer_service') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect berdasarkan role setelah login
function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Admin dan leader ke users, customer_service ke dashboard
  if (user?.role === 'admin' || user?.role === 'leader') {
    return <Navigate to="/users" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <CustomerServiceRoute>
                  <DashboardPage />
                </CustomerServiceRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <AdminLeaderRoute>
                  <UsersPage />
                </AdminLeaderRoute>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
