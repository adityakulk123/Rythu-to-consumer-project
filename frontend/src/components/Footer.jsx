import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Heart, Shield, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Rythu<span className="text-emerald-400">Direct</span>
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              {t('tagline')} Empowering Indian farmers with direct access to genuine commercial buyers, transparent digital weighing, and fair competitive pricing.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Shield className="w-4 h-4" />
              <span>Anti-Middleman Transparency Protocol</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li><Link to="/marketplace" className="hover:text-white transition">Explore Produce Listings</Link></li>
              <li><Link to="/market-prices" className="hover:text-white transition">APMC Mandi Bhav (Daily)</Link></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><Link to="/register" className="hover:text-white transition">Farmer Onboarding</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Buyer Verification</Link></li>
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Trust Standards</h4>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Certified Scale Weights</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Private Minimum Floor Prices</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Wholesalers & Retailers</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Digital Traceable Receipts</li>
            </ul>
          </div>

          {/* Test Accounts & Demo Info */}
          <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800 text-xs">
            <h4 className="text-amber-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>Demo Test Credentials</span>
            </h4>
            <p className="text-emerald-200/80 mb-2">Login with pre-seeded accounts:</p>
            <div className="space-y-1 font-mono text-[11px] text-emerald-100">
              <p><span className="text-emerald-400">Farmer:</span> 9876543210 / Farmer@123</p>
              <p><span className="text-emerald-400">Buyer:</span>  9876543220 / Buyer@123</p>
              <p><span className="text-emerald-400">Admin:</span>  9876543200 / Admin@123</p>
            </div>
            <p className="mt-2 text-[10px] text-emerald-400/80 italic">
              *All demo transactions are explicitly labeled DEMO.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
          <p>© 2026 RythuDirect Technologies. Built for India's Agricultural Future.</p>
          <div className="flex items-center gap-4">
            <span>English / తెలుగు Bilingual Edition</span>
            <span>Privacy Policy</span>
            <span>Terms of Trade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
