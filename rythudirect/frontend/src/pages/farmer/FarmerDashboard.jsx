import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Package, 
  Layers, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  PlusCircle, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const FarmerDashboard = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [recentOffers, setRecentOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, offersRes] = await Promise.all([
        api.get('/farmer/dashboard'),
        api.get('/farmer/offers'),
      ]);
      setMetrics(dashRes.data);
      setRecentOffers(offersRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Loading farmer dashboard metrics...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Farmer Overview</span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Welcome back, {metrics?.farmer_name}</h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            Village: {metrics?.village} • District: {metrics?.district}
          </p>
        </div>
        <Link
          to="/farmer/produce/add"
          className="px-5 py-3 bg-[#E9C46A] hover:bg-[#F4A261] text-emerald-950 font-black rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('addNewProduce')}</span>
        </Link>
      </div>

      {/* 6 OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('activeListings')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics?.total_active_listings || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Active in marketplace</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('totalAvailableQty')}</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics?.total_quantity_available_kg?.toLocaleString('en-IN') || 0} <span className="text-xs text-gray-400 font-normal">kg</span></p>
          <span className="text-[11px] text-gray-500 font-semibold">Harvest ready for trade</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('ordersReceived')}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics?.total_orders_received || 0}</p>
          <span className="text-[11px] text-blue-700 font-semibold">Confirmed buyer deals</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('pendingPayments')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-800">₹{metrics?.pending_payments_amount?.toLocaleString('en-IN') || 0}</p>
          <span className="text-[11px] text-amber-700 font-semibold">{metrics?.pending_payments_count || 0} orders awaiting clearance</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('completedSales')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900">{metrics?.completed_sales || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Fulfilled weighment deals</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('totalEarnings')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1B4332] flex items-center justify-center">
              <DollarSign className="w-4 h-4 font-black" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1B4332]">₹{metrics?.total_earnings?.toLocaleString('en-IN') || 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Net direct earnings</span>
        </div>

      </div>

      {/* RECENT BUYER OFFERS SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Recent Buyer Purchase Offers</h3>
            <p className="text-xs text-gray-500">Compare incoming bids and counter or accept lots</p>
          </div>
          <Link to="/farmer/offers" className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1">
            <span>View All Offers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOffers.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No incoming buyer offers yet. Your active listings are visible to verified buyers.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOffers.map((off) => (
              <div key={off.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{off.crop_name}</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {off.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Buyer: <strong>{off.buyer?.business_name || off.buyer?.full_name}</strong> • Rating: ⭐{off.buyer?.rating || "4.8"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Requested: <strong>{off.quantity} kg</strong> @ <strong className="text-emerald-800">₹{off.offered_price_per_kg}/kg</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/farmer/offers"
                    className="px-4 py-2 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Compare & Respond
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FarmerDashboard;
