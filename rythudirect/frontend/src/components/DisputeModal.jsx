import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import api from '../services/api';

const DisputeModal = ({ orderId, isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('INCORRECT_WEIGHT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError("Please describe the dispute issue with at least 10 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.post('/disputes', {
        order_id: orderId,
        reason: reason,
        description: description,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit dispute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        
        <div className="bg-red-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold">Report Dispute / Issue</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-700 text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Dispute *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
            >
              <option value="INCORRECT_WEIGHT">Incorrect Scale / Weighbridge Weight</option>
              <option value="UNFAIR_QUALITY_DEDUCTION">Unfair Quality Deductions</option>
              <option value="DAMAGED_PRODUCE">Damaged Produce During Transit</option>
              <option value="QUANTITY_MISMATCH">Quantity Mismatch at Arrival</option>
              <option value="NON_PAYMENT">Delayed / Non-Payment of Balance</option>
              <option value="DELIVERY_ISSUES">Delivery Failure / Excessive Delay</option>
              <option value="OTHER">Other Operational Dispute</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Explanation *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact facts, tare container weight discrepancies, scale slip references..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default DisputeModal;
