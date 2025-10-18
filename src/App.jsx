import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseAuthProvider, useAuth } from '@/contexts/SupabaseAuthContext'; // ✅ Correction ici
import { DataProvider } from '@/contexts/DataContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import AnimatedBackground from '@/components/AnimatedBackground';
import RegisterPage from '@/pages/RegisterPage';
import UpdateUserPage from '@/pages/UpdateUserPage';
// import PwaReloadPrompt from '@/components/PwaReloadPrompt';

function App() {
  return (
    <>
      <Helmet>
        <title>Eno Livraison - Système de Gestion</title>
        <meta
          name="description"
          content="Système de gestion complet pour agence de livraison Eno Livraison. Gestion des stocks, partenaires, comptabilité et livraisons."
        />
      </Helmet>

      <SupabaseAuthProvider>
        <DataProvider>
          <NotificationProvider>
            <Router>
              <AnimatedBackground />
              <AppRoutes />
              <Toaster />
              {/* <PwaReloadPrompt /> */}
            </Router>
          </NotificationProvider>
        </DataProvider>
      </SupabaseAuthProvider>
    </>
  );
}

const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <Routes>
        <Route
          path="/login"
          element={!session ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />}
        />
        <Route path="/update-user" element={<UpdateUserPage />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </div>
  );
};

export default App;

