import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDrawer from './NotificationDrawer';
import {
  Sprout,
  Languages,
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isFarmer, isBuyer, isAdmin, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isFarmer) return '/farmer';
    if (isBuyer) return '/buyer';
    return '/';
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-xs">
        {/* Top Info Bar */}
        <div className="bg-emerald-950 text-emerald-100 text-xs py-1 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium tracking-wide">
                {lang === 'te' ? 'రైతు డైరెక్ట్: దళారులు లేని పారదర్శక వ్యవసాయ మార్కెట్' : 'RythuDirect: Direct Farmer-to-Buyer Marketplace — Zero Commission Middlemen'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/market-prices" className="hover:text-emerald-300 transition flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{lang === 'te' ? 'నేటి మండి ధరలు' : "Today's Mandi Bhav"}</span>
              </Link>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 transition cursor-pointer"
                title="Switch Language / భాషను మార్చండి"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-700 transition">
                <Sprout className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-emerald-950 leading-tight">
                  Rythu<span className="text-emerald-700">Direct</span>
                </span>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  {lang === 'te' ? 'రైతు మార్కెట్' : 'Agri Fintech Platform'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-semibold transition hover:text-emerald-800 ${
                  location.pathname === '/' ? 'text-emerald-800 font-bold' : 'text-gray-700'
                }`}
              >
                {t('home')}
              </Link>
              <Link
                to="/marketplace"
                className={`text-sm font-semibold transition hover:text-emerald-800 flex items-center gap-1.5 ${
                  location.pathname === '/marketplace' ? 'text-emerald-800 font-bold' : 'text-gray-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                {t('explore_produce')}
              </Link>
              <Link
                to="/market-prices"
                className={`text-sm font-semibold transition hover:text-emerald-800 flex items-center gap-1.5 ${
                  location.pathname === '/market-prices' ? 'text-emerald-800 font-bold' : 'text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-amber-600" />
                {t('market_prices')}
              </Link>
            </div>

            {/* Desktop Action & User Controls */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="relative p-2 rounded-xl text-gray-600 hover:text-emerald-900 hover:bg-emerald-50 transition cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-sm hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                    <span>{user?.full_name?.split(' ')[0]} ({user?.role?.toUpperCase()})</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-emerald-900 font-semibold text-sm hover:bg-emerald-50 transition"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && (
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-emerald-50"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-gray-800 hover:bg-emerald-50"
            >
              {t('home')}
            </Link>
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-gray-800 hover:bg-emerald-50"
            >
              {t('explore_produce')}
            </Link>
            <Link
              to="/market-prices"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-medium text-gray-800 hover:bg-emerald-50"
            >
              {t('market_prices')}
            </Link>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-sm"
                  >
                    Go to {user?.role?.toUpperCase()} Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-2.5 rounded-xl border border-gray-200 text-red-600 font-semibold text-sm hover:bg-red-50"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-xl border border-emerald-800 text-emerald-900 font-semibold text-sm"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-sm"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <NotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
