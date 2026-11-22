import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Package, 
  MessageSquare, 
  ShoppingBag, 
  CheckCircle, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const BuyerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuyerDashboard();
  }, []);

  const loadBuyerDashboard = async () => {
    try {
      const res = await api.get('/buyer/dashboard');
      setMetrics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-gray-500">Loading buyer procurement dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Buyer Procurement Console</span>
            {metrics?.is_verified ? (
              <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Procurement Partner</span>
              </span>
            ) : (
              <span className="bg-amber-400 text-amber-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                Verification Pending
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {metrics?.business_name || metrics?.buyer_name}
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            Direct Farm-Gate Agricultural Sourcing & Digital Mandi Trades
          </p>
        </div>

        <Link
          to="/explore"
          className="px-5 py-3 bg-[#E9C46A] hover:bg-[#F4A261] text-emerald-950 font-black rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Package className="w-4 h-4" />
          <span>Browse Available Crops</span>
        </Link>
      </div>

      {/* 5 BUYER OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Available Produce</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics?.available_produce_count || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Active harvest lots</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Active Quotations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-800">{metrics?.active_quotations || 0}</p>
          <span className="text-[11px] text-amber-700 font-semibold">In negotiation</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">{metrics?.pending_orders || 0}</p>
          <span className="text-[11px] text-blue-700 font-semibold">Awaiting weighment</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900">{metrics?.completed_orders || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Settled deals</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Total Purchases</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1B4332] flex items-center justify-center">
              <DollarSign className="w-4 h-4 font-black" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1B4332]">₹{metrics?.total_purchases?.toLocaleString('en-IN') || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Direct farm procurement</span>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/explore"
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#1B4332] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900">Explore Crop Lots</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Search tomatoes, chilli, paddy, cotton, onions, and turmeric directly from certified farmers.
          </p>
        </Link>

        <Link
          to="/buyer/offers"
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900">Active Quotations</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Manage your submitted bids and counteroffers with farmers in real-time.
          </p>
        </Link>

        <Link
          to="/buyer/orders"
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900">Orders & Scale Weighment</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Verify certified scale slips, confirm net tare weights, and disburse escrow settlements.
          </p>
        </Link>
      </div>

    </div>
  );
};

export default BuyerDashboard;
