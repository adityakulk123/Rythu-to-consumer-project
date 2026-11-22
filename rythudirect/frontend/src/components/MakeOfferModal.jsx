import React, { useState } from 'react';
import { X, Send, AlertCircle, Calendar, Truck, DollarSign } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MakeOfferModal = ({ produce, isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('PICKUP');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !produce) return null;

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(offeredPrice) || 0;
  const totalAmount = (numQty * numPrice).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (numQty <= 0) {
      setError("Please specify a valid quantity greater than 0.");
      return;
    }
    if (numQty > parseFloat(produce.remaining_quantity)) {
      setError(`Quantity cannot exceed available stock (${produce.remaining_quantity} kg).`);
      return;
    }
    if (numPrice <= 0) {
      setError("Please specify a valid price per kg.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/buyer/offers', {
        produce_id: produce.id,
        quantity: numQty,
        offered_price_per_kg: numPrice,
        preferred_delivery_date: deliveryDate || null,
        delivery_method: deliveryMethod,
        additional_requirements: requirements || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit purchase offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Submit Purchase Quotation</h3>
            <p className="text-xs text-emerald-200 font-medium">
              {produce.crop_name} • Asking: ₹{produce.expected_price_per_kg}/kg
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Remaining Available Stock:</span>
            <span className="font-extrabold text-[#1B4332] text-sm">
              {produce.remaining_quantity} {produce.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Required Quantity (kg) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Max ${produce.remaining_quantity}`}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Offered Price (₹/kg) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="e.g. 14.50"
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>
          </div>

          {/* Live Total Calculation Card */}
          {numQty > 0 && numPrice > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 uppercase font-bold tracking-wider">Total Deal Estimate</span>
                <p className="text-xs text-amber-700">{numQty} kg × ₹{numPrice}/kg</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-900">₹{parseFloat(totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Preferred Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Delivery Method
              </label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="PICKUP">Farm Gate Pickup</option>
                <option value="DELIVERY">Direct Field Delivery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quality Specs or Notes
            </label>
            <textarea
              rows={2}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. Need crate packaging, will send truck on Thursday morning..."
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
              className="px-6 py-2.5 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting..." : "Send Purchase Offer"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default MakeOfferModal;
