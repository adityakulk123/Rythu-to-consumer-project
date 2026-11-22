import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CounterOfferModal = ({ offer, isOpen, onClose, onSuccess, isFarmer }) => {
  const [counterPrice, setCounterPrice] = useState(offer?.offered_price_per_kg || '');
  const [counterQty, setCounterQty] = useState(offer?.quantity || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !offer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isFarmer
        ? `/farmer/offers/${offer.id}/counter`
        : `/buyer/offers/${offer.id}/counter`;

      await api.post(endpoint, {
        counter_price_per_kg: parseFloat(counterPrice),
        counter_quantity: counterQty ? parseFloat(counterQty) : null,
        notes: notes || "Counteroffer price adjustment",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit counteroffer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        
        <div className="bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Send Counteroffer</h3>
            <p className="text-xs text-emerald-200">
              Current Offer: ₹{offer.offered_price_per_kg}/kg for {offer.quantity} kg
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Your Counter Price (₹/kg) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Counter Quantity (kg)
            </label>
            <input
              type="number"
              step="any"
              value={counterQty}
              onChange={(e) => setCounterQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Negotiation Note
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Can agree to ₹13.50 if pickup is done before Saturday."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {loading ? "Sending..." : "Send Counter"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CounterOfferModal;
