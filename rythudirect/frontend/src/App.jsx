import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import ExploreProducePage from './pages/ExploreProducePage';
import ProduceDetailPage from './pages/ProduceDetailPage';
import MarketPricesPage from './pages/MarketPricesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProduceList from './pages/farmer/FarmerProduceList';
import AddProducePage from './pages/farmer/AddProducePage';
import FarmerOffersPage from './pages/farmer/FarmerOffersPage';
import FarmerOrdersPage from './pages/farmer/FarmerOrdersPage';
import FarmerPaymentsPage from './pages/farmer/FarmerPaymentsPage';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerOffersPage from './pages/buyer/BuyerOffersPage';
import BuyerOrdersPage from './pages/buyer/BuyerOrdersPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* Public and General Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<ExploreProducePage />} />
              <Route path="/produce/:id" element={<ProduceDetailPage />} />
              <Route path="/market-prices" element={<MarketPricesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Farmer Protected Dashboard Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="produce" element={<FarmerProduceList />} />
              <Route path="produce/add" element={<AddProducePage />} />
              <Route path="offers" element={<FarmerOffersPage />} />
              <Route path="orders" element={<FarmerOrdersPage />} />
              <Route path="payments" element={<FarmerPaymentsPage />} />
            </Route>

            {/* Buyer Protected Dashboard Routes */}
            <Route
              path="/buyer"
              element={
                <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="offers" element={<BuyerOffersPage />} />
              <Route path="orders" element={<BuyerOrdersPage />} />
            </Route>

            {/* Admin Protected Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
