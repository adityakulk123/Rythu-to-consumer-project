import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CounterOfferModal from '../../components/CounterOfferModal';
import { 
  MessageSquare, 
  Check, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';

const FarmerOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferForCounter, setSelectedOfferForCounter] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer/offers');
      setOffers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(`/farmer/offers/${offerId}/accept`);
      setActionSuccess(res.data.message || "Offer accepted! Confirmed order created.");
      loadOffers();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to accept offer.");
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm("Are you sure you want to decline this purchase offer?")) return;
    setActionError(null);
    try {
      await api.post(`/farmer/offers/${offerId}/reject`);
      loadOffers();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to reject offer.");
    }
  };

  // Group offers by produce listing for side-by-side quotation comparison
  const groupedOffers = offers.reduce((acc, curr) => {
    const key = curr.produce_id;
    if (!acc[key]) {
      acc[key] = {
        cropName: curr.crop_name,
        remainingQty: curr.produce_remaining_quantity,
        askingPrice: curr.produce_expected_price,
        offers: [],
      };
    }
    acc[key].offers.push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">Smart Price Negotiation Engine</h2>
        <p className="text-xs text-gray-500">
          Compare multi-buyer quotations, accept partial lot allocations, and lock deals directly
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-700">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading incoming buyer quotations...</div>
      ) : Object.keys(groupedOffers).length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-2">
          <p className="text-sm font-semibold text-gray-600">No buyer quotations received yet.</p>
          <p className="text-xs text-gray-400">When verified buyers submit purchase offers for your produce, you will compare them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedOffers).map(([produceId, group]) => (
            <div key={produceId} className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden space-y-4 p-6">
              
              {/* Group Header: Crop & Stock Available */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-gray-900">{group.cropName}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {group.offers.length} Quotations Received
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your Asking Price: <strong>₹{group.askingPrice}/kg</strong>
                  </p>
                </div>

                <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Remaining Unsold Stock</span>
                  <span className="text-base font-black text-[#1B4332]">{group.remainingQty} kg</span>
                </div>
              </div>

              {/* Multi-Buyer Offers Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.offers.map((off) => {
                  const isAccepted = off.status === 'ACCEPTED';
                  const isPending = off.status === 'PENDING' || off.status === 'COUNTERED';
                  const totalEst = (parseFloat(off.quantity) * parseFloat(off.offered_price_per_kg)).toFixed(2);

                  return (
                    <div
                      key={off.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isAccepted
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Buyer Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900">
                              {off.buyer?.business_name || off.buyer?.full_name}
                            </h4>
                            <span className="text-[10px] text-gray-500 block">
                              {off.buyer?.business_type} • {off.buyer?.district}
                            </span>
                          </div>
                          {off.buyer?.is_verified && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        {/* Bid Details */}
                        <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Offered Price:</span>
                            <span className="font-black text-emerald-800 text-sm">₹{off.offered_price_per_kg}/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Requested Lot:</span>
                            <span className="font-extrabold text-gray-900">{off.quantity} kg</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-100 pt-1 font-mono">
                            <span className="text-gray-500 font-sans">Total Est:</span>
                            <span className="font-black text-amber-900">₹{parseFloat(totalEst).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 pt-0.5">
                            <span>Delivery:</span>
                            <span className="font-semibold">{off.delivery_method}</span>
                          </div>
                        </div>

                        {off.additional_requirements && (
                          <p className="text-[11px] text-gray-500 italic mt-2 line-clamp-2">
                            "{off.additional_requirements}"
                          </p>
                        )}
                      </div>

                      {/* Status & Actions */}
                      <div className="pt-2 border-t border-gray-100">
                        {isAccepted ? (
                          <div className="text-center py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>Accepted • Order Confirmed</span>
                          </div>
                        ) : isPending ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleAccept(off.id)}
                              className="py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setSelectedOfferForCounter(off)}
                              className="py-2 bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl text-xs font-bold transition-colors"
                            >
                              Counter
                            </button>
                            <button
                              onClick={() => handleReject(off.id)}
                              className="py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-1 text-xs text-gray-400 font-semibold uppercase">
                            {off.status}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Counter Offer Modal */}
      {selectedOfferForCounter && (
        <CounterOfferModal
          offer={selectedOfferForCounter}
          isOpen={!!selectedOfferForCounter}
          onClose={() => setSelectedOfferForCounter(null)}
          onSuccess={() => {
            setActionSuccess("Counteroffer dispatched to the buyer.");
            loadOffers();
          }}
          isFarmer={true}
        />
      )}

    </div>
  );
};

export default FarmerOffersPage;
