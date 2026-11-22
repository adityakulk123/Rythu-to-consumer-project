import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CounterOfferModal from '../../components/CounterOfferModal';
import { MessageSquare, RefreshCw, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

const BuyerOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferForCounter, setSelectedOfferForCounter] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadMyOffers();
  }, []);

  const loadMyOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/buyer/offers');
      setOffers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOffer = async (id) => {
    if (!window.confirm("Cancel this purchase quotation?")) return;
    try {
      await api.post(`/buyer/offers/${id}/cancel`);
      setMessage("Offer cancelled successfully.");
      loadMyOffers();
    } catch (e) {
      alert("Failed to cancel offer.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">My Purchase Quotations & Bids</h2>
        <p className="text-xs text-gray-500">Track and negotiate prices directly with produce farmers</p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading your quotations...</div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-semibold text-gray-600">No active quotations found.</p>
          <p className="text-xs text-gray-400 mt-1">Browse active harvest produce and submit your purchase bids.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((off) => {
            const isAccepted = off.status === 'ACCEPTED';
            const isPending = off.status === 'PENDING' || off.status === 'COUNTERED';
            const total = (parseFloat(off.quantity) * parseFloat(off.offered_price_per_kg)).toFixed(2);

            return (
              <div
                key={off.id}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{off.crop_name}</h3>
                    <p className="text-xs text-gray-500">Farmer: <strong>{off.farmer_name}</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-800'
                        : off.status === 'EXPIRED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {off.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Your Offer Price</span>
                    <p className="font-black text-emerald-800 text-sm">₹{off.offered_price_per_kg}/kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Required Lot</span>
                    <p className="font-extrabold text-gray-900">{off.quantity} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Total Deal Amount</span>
                    <p className="font-black text-amber-900">₹{parseFloat(total).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Delivery Mode</span>
                    <p className="font-semibold text-gray-800">{off.delivery_method}</p>
                  </div>
                </div>

                {/* Negotiation Thread History */}
                {off.negotiations?.length > 1 && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1.5 text-xs">
                    <span className="font-bold text-[10px] uppercase text-amber-900 tracking-wider">Negotiation History:</span>
                    {off.negotiations.map((n) => (
                      <div key={n.id} className="text-[11px] text-gray-600 flex justify-between">
                        <span>{n.sender_name} ({n.sender_role}): countered with ₹{n.counter_price_per_kg}/kg</span>
                        <span className="text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {isPending && (
                    <>
                      <button
                        onClick={() => setSelectedOfferForCounter(off)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl text-xs font-bold transition-colors"
                      >
                        Counteroffer
                      </button>
                      <button
                        onClick={() => handleCancelOffer(off.id)}
                        className="px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
                      >
                        Cancel Bid
                      </button>
                    </>
                  )}
                  {isAccepted && (
                    <span className="text-xs font-bold text-emerald-800">
                      ✓ Offer Confirmed. View in Orders to log weighment & escrow.
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedOfferForCounter && (
        <CounterOfferModal
          offer={selectedOfferForCounter}
          isOpen={!!selectedOfferForCounter}
          onClose={() => setSelectedOfferForCounter(null)}
          onSuccess={loadMyOffers}
          isFarmer={false}
        />
      )}

    </div>
  );
};

export default BuyerOffersPage;
