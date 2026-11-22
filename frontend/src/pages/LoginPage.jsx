import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DemoBadge from '../components/DemoBadge';
import {
  Sprout,
  LogIn,
  AlertCircle,
  KeyRound,
  UserCheck,
  Building2,
  ShieldAlert
} from 'lucide-react';

export default function LoginPage() {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in both mobile number/email and password");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await client.post('/auth/login', {
        mobile_or_email: identifier,
        password: password
      });

      const { access_token, role, user_id, full_name, mobile_number } = res.data;
      const userData = { id: user_id, role, full_name, mobile_number };
      loginUser(access_token, userData);

      // Redirect based on role or URL redirect param
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (role === 'farmer') {
        navigate('/farmer');
      } else if (role === 'buyer') {
        navigate('/buyer');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid login credentials. Please check your mobile/email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Demo Auto-fill Helper
  const quickLogin = (mobile, pass) => {
    setIdentifier(mobile);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAF6]">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white shadow-md mb-3">
            <Sprout className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Login to RythuDirect
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Access your agricultural marketplace portal
          </p>
        </div>

        {/* Quick Demo Logins Card */}
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> 1-Click Demo Accounts
            </span>
            <DemoBadge text="TEST ROLES" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('9876543210', 'Farmer@123')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 text-emerald-900 hover:bg-emerald-50 text-[11px] font-bold text-center transition cursor-pointer"
            >
              🌱 Farmer<br/><span className="text-[10px] text-gray-500 font-normal">Rami Reddy</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('9876543220', 'Buyer@123')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 text-emerald-900 hover:bg-emerald-50 text-[11px] font-bold text-center transition cursor-pointer"
            >
              🛒 Buyer<br/><span className="text-[10px] text-gray-500 font-normal">Suresh Agarwal</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('9876543200', 'Admin@123')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 text-emerald-900 hover:bg-emerald-50 text-[11px] font-bold text-center transition cursor-pointer"
            >
              🛡️ Admin<br/><span className="text-[10px] text-gray-500 font-normal">Administrator</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registered Mobile Number or Email *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210 or farmer@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700">Password *</label>
                <span className="text-[11px] text-emerald-800 hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? "Signing In..." : "Sign In to RythuDirect"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-800 hover:text-emerald-950">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
