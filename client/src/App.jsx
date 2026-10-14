import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
function Protected() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <main className="center" aria-busy="true">
        Loading TeamFlow…
      </main>
    );
  return user ? <Dashboard /> : <Navigate to="/login" replace />;
}
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/*" element={<Protected />} />
      </Routes>
    </AuthProvider>
  );
}
export default App;
