
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Guest } from './pages/Guest';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { LoginSelect } from './pages/LoginSelect';
import { Register } from './pages/Register';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login-select" element={<LoginSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/customer" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        {/* Legacy route redirect */}
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
