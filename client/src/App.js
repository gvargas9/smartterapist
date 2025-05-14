import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { initApp } from './utils/supabaseData';
import { loginAs } from './utils/loginHelper';

// Import i18n configuration
import './i18n';
import { LanguageProvider } from './context/LanguageContext';

// Development components
import DevLogin from './components/DevLogin';

// Layout components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import SupabaseTestPage from './pages/SupabaseTestPage';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import ClientChat from './pages/client/Chat';

// Therapist Pages
import TherapistDashboard from './pages/therapist/Dashboard';
import TherapistClientList from './pages/therapist/ClientList';
import TherapistClientDetail from './pages/therapist/ClientDetail';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminBehaviorManagement from './pages/admin/BehaviorManagement';
import NotFound from './pages/NotFound';

function App() {
  const { user, loading } = useAuth();
  
  // Initialize application with Supabase data
  useEffect(() => {
    initApp().then(() => {
      console.log('✅ Application initialized with Supabase data');
      
      // Expose login helper function to window object for easy access in development
      if (process.env.NODE_ENV === 'development') {
        window.loginAs = loginAs;
        console.log('💡 Development login helper available. Use window.loginAs("client"), window.loginAs("therapist"), or window.loginAs("admin") to log in.');
      }
    }).catch(error => {
      console.error('Error initializing application:', error);
    });
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      {/* Development Login Helper */}
      {process.env.NODE_ENV !== 'production' && <DevLogin />}
      
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/supabase-test" element={<SupabaseTestPage />} />
      
      {/* Client Routes */}
      <Route element={<ProtectedRoute role="client" />}>
        <Route element={<Layout type="client" />}>
          <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/chat" element={<ClientChat />} />
        </Route>
      </Route>
      
      {/* Therapist Routes */}
      <Route element={<ProtectedRoute role="therapist" />}>
        <Route element={<Layout type="therapist" />}>
          <Route path="/therapist" element={<Navigate to="/therapist/dashboard" replace />} />
          <Route path="/therapist/dashboard" element={<TherapistDashboard />} />
          <Route path="/therapist/clients" element={<TherapistClientList />} />
          <Route path="/therapist/clients/:id" element={<TherapistClientDetail />} />
        </Route>
      </Route>
      
      {/* Admin Routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<Layout type="admin" />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/behaviors" element={<AdminBehaviorManagement />} />
          <Route path="/admin/users/:id" element={<AdminUserManagement />} />
        </Route>
      </Route>
      
      {/* Redirect from home to therapist dashboard by default in development mode */}
      <Route path="/" element={<Navigate to="/therapist/dashboard" replace />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </LanguageProvider>
  );
}

export default App;
