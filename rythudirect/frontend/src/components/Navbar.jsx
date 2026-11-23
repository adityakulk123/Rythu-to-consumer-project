import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import api from '../services/api';
import { 
  Sprout, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  TrendingUp, 
  ShoppingBag, 
  Building2,
  Sparkles,
  MapPin,
  Clock,
  ChevronDown
} from 'lucide-react';

const Navbar = ({ onOpenAddressModal }) => {
  const { user, isAuthenticated, logout, isFarmer, isBuyer, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { totalItemsCount, subtotal, setIsCartOpen, deliveryAddress } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isStoreMode = location.pathname === '/store' || location.pathname === '/';
  const isDealerMode = location.pathname.startsWith('/explore') || location.pathname.startsWith('/produce');

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch (e) {
      // ignore in silent polling
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getDashboardPath = () => {
    if (isFarmer) return '/farmer/dashboard';
    if (isBuyer) return '/buyer/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1B4332] text-white shadow-md border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Sprout className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  Rythu<span className="text-[#E9C46A]">Direct</span>
                </span>
                <p className="text-[10px] text-emerald-200/80 font-medium tracking-wider uppercase hidden sm:block">
                  Farm-Fresh Quick Mart & Wholesale
                </p>
              </div>
            </Link>

            {/* Quick Mode Toggle: Consumer Store vs Wholesale Dealer */}
            <div className="hidden lg:flex items-center bg-emerald-950/80 p-1 rounded-2xl border border-emerald-800/80 text-xs font-bold">
              <Link
                to="/store"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  isStoreMode
                    ? 'bg-[#E9C46A] text-slate-900 shadow-md font-black'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <span>🛒 Customer Quick Mart</span>
                <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 py-0.2 rounded font-mono">15m</span>
              </Link>
              <Link
                to="/explore"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  isDealerMode
                    ? 'bg-[#E9C46A] text-slate-900 shadow-md font-black'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>🏢 Wholesale / Dealer</span>
                <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 py-0.2 rounded font-mono">Bulk</span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/store"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                location.pathname === '/store' ? 'text-[#E9C46A] font-bold' : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <span>Fresh Mart</span>
            </Link>
            <Link
              to="/explore"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                location.pathname === '/explore' ? 'text-[#E9C46A] font-bold' : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <span>Wholesale Mandi</span>
            </Link>
            <Link
              to="/market-prices"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-[#E9C46A]" />
              <span>APMC Prices</span>
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher />

            {/* Blinkit Style CART BUTTON */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-[#E9C46A] hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-lg shadow-amber-400/20 transition-all active:scale-95"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-900 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs">
                {totalItemsCount > 0 ? `${totalItemsCount} items • ₹${subtotal}` : 'My Basket'}
              </span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-2 rounded-full hover:bg-emerald-800/80 text-emerald-100 hover:text-white relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-emerald-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="bg-[#1B4332] text-white px-4 py-3 flex items-center justify-between">
                        <span className="font-bold text-sm">Notifications ({notifications.length})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-200 hover:text-white underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 hover:bg-emerald-50/50 transition-colors ${
                                !n.is_read ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={() => setNotifOpen(false)}
                                  className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                                >
                                  View Details &rarr;
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Action Button */}
                <Link
                  to={getDashboardPath()}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.full_name?.split(' ')[0] || t('dashboard')}</span>
                  <span className="text-[9px] bg-black/25 px-1 py-0.5 rounded font-mono uppercase">
                    {user?.role}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-bold text-emerald-100 hover:text-white hover:bg-emerald-800/50 rounded-xl transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Cart + Menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 bg-[#E9C46A] text-slate-950 font-black px-2.5 py-1.5 rounded-xl shadow text-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalItemsCount > 0 ? `₹${subtotal}` : 'Cart'}</span>
            </button>

            <LanguageSwitcher />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#143326] border-t border-emerald-800/80 px-4 pt-3 pb-6 space-y-2">
          
          {/* Mobile Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-emerald-800/50 text-center text-xs font-bold">
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 rounded-xl bg-[#E9C46A] text-slate-950 font-black"
            >
              🛒 Customer Quick Mart
            </Link>
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 rounded-xl bg-emerald-900 text-emerald-200 border border-emerald-700"
            >
              🏢 Wholesale Mandi
            </Link>
          </div>

          <Link
            to="/store"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70"
          >
            Fresh Mart (15 Mins Delivery)
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70"
          >
            Wholesale Mandi (Dealer Bidding)
          </Link>
          <Link
            to="/market-prices"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-[#E9C46A]" />
            APMC Mandi Rates
          </Link>

          <div className="pt-3 border-t border-emerald-800/50">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow text-sm"
                >
                  {t('dashboard')} ({user?.full_name})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="block w-full text-center bg-red-600/80 text-white font-semibold py-2 rounded-xl text-sm"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-emerald-800/80 text-white font-bold text-xs"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-[#E9C46A] text-emerald-950 font-extrabold text-xs"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
