import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(identifier, password);
      // Redirect based on role
      if (user.role === 'FARMER') navigate('/farmer/dashboard');
      else if (user.role === 'BUYER') navigate('/buyer/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid mobile/email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (mobile, pwd) => {
    setIdentifier(mobile);
    setPassword(pwd);
    setLoading(true);
    try {
      const user = await login(mobile, pwd);
      if (user.role === 'FARMER') navigate('/farmer/dashboard');
      else if (user.role === 'BUYER') navigate('/buyer/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err) {
      setError("Demo login error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/80 max-w-md w-full p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center mx-auto shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Sign in to RythuDirect</h2>
          <p className="text-xs text-gray-500">Access your farmer or buyer account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Registered Mobile Number or Email *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9848011111"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1B4332] hover:bg-emerald-800 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? "Signing in..." : "Login"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials for Evaluation */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block text-center">
            One-Click Test Accounts (Development Mode)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin("9848011111", "farmer123")}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] rounded-lg text-[11px] font-bold border border-emerald-200"
            >
              🌾 Farmer
            </button>
            <button
              onClick={() => handleQuickDemoLogin("9700011111", "buyer123")}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200"
            >
              🏢 Buyer
            </button>
            <button
              onClick={() => handleQuickDemoLogin("9999999999", "admin123")}
              className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-[11px] font-bold border border-gray-300"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          New to RythuDirect?{" "}
          <Link to="/register" className="font-extrabold text-emerald-700 hover:underline">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
