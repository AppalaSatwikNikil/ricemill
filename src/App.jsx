import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import './App.css';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';

// Simple Inline Error Boundary for now
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--color-bg-light)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>SANTI RICE MILL</h1>
          <h2>Something went wrong.</h2>
          <p style={{ color: 'red', margin: '1.5rem 0', maxWidth: '500px' }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary">Go to Home</button>
          <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ marginTop: '1rem' }}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children || null;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public routes (Login/Register accessible only when logged out) */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            {/* Protected routes (Accessible only when logged in) */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            {/* Catch-all - redirect to landing (Home) which handles auth check */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </ErrorBoundary>
  );
}

export default App;
