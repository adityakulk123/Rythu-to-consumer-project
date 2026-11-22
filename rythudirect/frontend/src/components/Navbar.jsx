import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  CheckCircle, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, isFarmer, isBuyer, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                Rythu<span className="text-[#E9C46A]">Direct</span>
              </span>
              <p className="text-[10px] text-emerald-200/80 font-medium tracking-wider uppercase hidden sm:block">
                Fair Prices • Direct Buyers
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              to="/explore"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors"
            >
              {t('exploreProduce')}
            </Link>
            <Link
              to="/market-prices"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-[#E9C46A]" />
              {t('marketPrices')}
            </Link>
            <a
              href="/#how-it-works"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors"
            >
              {t('howItWorks')}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                
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
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.full_name?.split(' ')[0] || t('dashboard')}</span>
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono uppercase">
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
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-emerald-100 hover:text-white hover:bg-emerald-800/50 rounded-xl transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-[#E9C46A] hover:bg-[#F4A261] text-emerald-950 px-4 py-2 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
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
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70"
          >
            {t('home')}
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70"
          >
            {t('exploreProduce')}
          </Link>
          <Link
            to="/market-prices"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-100 hover:bg-emerald-800/70 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-[#E9C46A]" />
            {t('marketPrices')}
          </Link>

          <div className="pt-3 border-t border-emerald-800/50">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow"
                >
                  {t('dashboard')} ({user?.full_name})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="block w-full text-center bg-red-600/80 text-white font-semibold py-2 rounded-xl"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-emerald-800/80 text-white font-bold"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-[#E9C46A] text-emerald-950 font-extrabold"
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
