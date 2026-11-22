import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import MarketPricesPage from './pages/MarketPricesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Route Guards
const ProtectedFarmerRoute = ({ children }) => {
  const { isAuthenticated, isFarmer, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-sm text-gray-500">Authenticating...</div>;
  if (!isAuthenticated) return <Navigate to="/login?redirect=/farmer" />;
  if (!isFarmer) return <Navigate to="/" />;
  return children;
};

const ProtectedBuyerRoute = ({ children }) => {
  const { isAuthenticated, isBuyer, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-sm text-gray-500">Authenticating...</div>;
  if (!isAuthenticated) return <Navigate to="/login?redirect=/buyer" />;
  if (!isBuyer) return <Navigate to="/" />;
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-sm text-gray-500">Authenticating...</div>;
  if (!isAuthenticated) return <Navigate to="/login?redirect=/admin" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/market-prices" element={<MarketPricesPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Dashboards */}
                  <Route
                    path="/farmer/*"
                    element={
                      <ProtectedFarmerRoute>
                        <FarmerDashboard />
                      </ProtectedFarmerRoute>
                    }
                  />
                  <Route
                    path="/buyer/*"
                    element={
                      <ProtectedBuyerRoute>
                        <BuyerDashboard />
                      </ProtectedBuyerRoute>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
