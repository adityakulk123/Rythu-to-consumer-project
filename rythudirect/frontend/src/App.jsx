import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Quick-Commerce Pages (Blinkit / Instamart style)
import CustomerStorePage from './pages/CustomerStorePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Public & Wholesale Dealer Pages
import LandingPage from './pages/LandingPage';
import ExploreProducePage from './pages/ExploreProducePage';
import ProduceDetailPage from './pages/ProduceDetailPage';
import MarketPricesPage from './pages/MarketPricesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Farmer Protected Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProduceList from './pages/farmer/FarmerProduceList';
import AddProducePage from './pages/farmer/AddProducePage';
import FarmerOffersPage from './pages/farmer/FarmerOffersPage';
import FarmerOrdersPage from './pages/farmer/FarmerOrdersPage';
import FarmerPaymentsPage from './pages/farmer/FarmerPaymentsPage';

// Buyer Protected Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerOffersPage from './pages/buyer/BuyerOffersPage';
import BuyerOrdersPage from './pages/buyer/BuyerOrdersPage';

// Admin Protected Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Helper wrappers to pass modal context
const CustomerStoreWrapper = () => {
  const { onOpenAddressModal } = useOutletContext();
  return <CustomerStorePage onOpenAddressModal={onOpenAddressModal} />;
};

const CheckoutWrapper = () => {
  const { onOpenAddressModal } = useOutletContext();
  return <CheckoutPage onOpenAddressModal={onOpenAddressModal} />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>

              {/* Public & Customer Routes */}
              <Route element={<MainLayout />}>
                {/* Home defaults to Customer Quick Mart (Blinkit style) */}
                <Route path="/" element={<CustomerStoreWrapper />} />
                <Route path="/store" element={<CustomerStoreWrapper />} />
                <Route path="/checkout" element={<CheckoutWrapper />} />
                <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />

                {/* Wholesale Mandi & Dealer Auctions */}
                <Route path="/explore" element={<ExploreProducePage />} />
                <Route path="/produce/:id" element={<ProduceDetailPage />} />
                <Route path="/market-prices" element={<MarketPricesPage />} />
                <Route path="/overview" element={<LandingPage />} />
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
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
