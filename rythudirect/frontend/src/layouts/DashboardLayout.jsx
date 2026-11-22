import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  MessageSquare, 
  ShoppingBag, 
  CreditCard, 
  ShieldAlert, 
  Users, 
  TrendingUp,
  Tag
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, isFarmer, isBuyer, isAdmin } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const farmerNav = [
    { label: t('farmerDashboard'), path: '/farmer/dashboard', icon: LayoutDashboard },
    { label: t('addNewProduce'), path: '/farmer/produce/add', icon: PlusCircle },
    { label: t('manageProduce'), path: '/farmer/produce', icon: Package },
    { label: t('buyerOffers'), path: '/farmer/offers', icon: MessageSquare },
    { label: t('orders'), path: '/farmer/orders', icon: ShoppingBag },
    { label: t('payments'), path: '/farmer/payments', icon: CreditCard },
  ];

  const buyerNav = [
    { label: t('dashboard'), path: '/buyer/dashboard', icon: LayoutDashboard },
    { label: t('exploreProduce'), path: '/explore', icon: Package },
    { label: "My Quotations", path: '/buyer/offers', icon: MessageSquare },
    { label: t('orders'), path: '/buyer/orders', icon: ShoppingBag },
    { label: t('marketPrices'), path: '/market-prices', icon: TrendingUp },
  ];

  const adminNav = [
    { label: "Admin Console", path: '/admin/dashboard', icon: LayoutDashboard },
    { label: "Market Prices", path: '/market-prices', icon: TrendingUp },
  ];

  const navItems = isFarmer ? farmerNav : (isBuyer ? buyerNav : adminNav);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Dashboard Left Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/80 sticky top-24 space-y-6">
              
              {/* User Profile Card */}
              <div className="pb-4 border-b border-gray-100 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm text-gray-900 truncate">{user?.full_name}</h3>
                  <p className="text-xs text-gray-500 font-medium capitalize">{user?.role?.toLowerCase()}</p>
                  <p className="text-[11px] text-emerald-700 font-medium truncate">{user?.village}, {user?.district}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#1B4332] text-white shadow-xs'
                          : 'text-gray-600 hover:text-emerald-900 hover:bg-emerald-50/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Status card */}
              <div className="pt-2">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Account Status: Verified
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    APMC & Mandi direct trading active.
                  </p>
                </div>
              </div>

            </div>
          </aside>

          {/* Main Dashboard Content */}
          <main className="md:col-span-3">
            <Outlet />
          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
