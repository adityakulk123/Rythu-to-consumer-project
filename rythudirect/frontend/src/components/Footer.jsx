import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, ShieldCheck, Scale, Award, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#12281E] text-gray-300 pt-16 pb-10 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Pillars Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-emerald-900/60">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Direct & Fair Prices</h4>
              <p className="text-xs text-gray-400">Zero middleman exploitation</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Certified Weighment</h4>
              <p className="text-xs text-gray-400">Tare & net weight verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Verified B2B Buyers</h4>
              <p className="text-xs text-gray-400">GSTIN & APMC verified traders</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/60 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Protected Escrow</h4>
              <p className="text-xs text-gray-400">Prompt payments on delivery</p>
            </div>
          </div>
        </div>

        {/* Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Rythu<span className="text-[#E9C46A]">Direct</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed pr-6">
              A specialized agricultural marketplace engineered to empower smallholder and commercial farmers across Telangana and Andhra Pradesh with transparent farm-gate price discovery, smart negotiation, and certified weighbridge delivery.
            </p>
            <div className="flex items-center space-x-4 pt-1">
              <div className="bg-emerald-950/80 border border-emerald-800/60 rounded-xl p-3 flex items-center space-x-3">
                <Phone className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase">Kisan Sahayatha Helpline</div>
                  <div className="text-sm font-extrabold text-white">1800-180-1551 (Toll-Free)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Marketplace</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Browse Produce</Link></li>
              <li><Link to="/market-prices" className="hover:text-emerald-400 transition-colors">Mandi Benchmark Rates</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Farmer Registration</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Buyer Verification</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Workflows</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="/#how-it-works" className="hover:text-emerald-400 transition-colors">Smart Quotation Engine</a></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-400 transition-colors">Weighment Audit Trail</a></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-400 transition-colors">Escrow Milestones</a></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-400 transition-colors">Dispute Resolution</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Legal & Transparency</h5>
            <ul className="space-y-2 text-xs">
              <li className="text-gray-400">Direct Farmer Procurement</li>
              <li className="text-gray-400">APMC Compliant Trading</li>
              <li className="text-gray-400">Certified Weighment Policy</li>
              <li className="text-gray-400">Privacy & Data Governance</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RythuDirect Marketplace. Fair Prices. Direct Buyers. Better Farming.</p>
          <p className="mt-2 sm:mt-0">Built for Indian Farmers & Verified Procurement Partners.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
