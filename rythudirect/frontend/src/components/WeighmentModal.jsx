import React, { useState } from 'react';
import { X, Scale, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import api from '../services/api';

const WeighmentModal = ({ order, weighment, isOpen, onClose, onSuccess, currentUserRole }) => {
  const [grossWeight, setGrossWeight] = useState(weighment?.gross_weight || order?.agreed_quantity || '');
  const [packagingWeight, setPackagingWeight] = useState(weighment?.packaging_weight || '0');
  const [rejectedQty, setRejectedQty] = useState(weighment?.rejected_quantity || '0');
  const [qualityGrade, setQualityGrade] = useState(weighment?.quality_grade || 'Grade A');
  const [scaleSlipNo, setScaleSlipNo] = useState(weighment?.scale_slip_number || '');
  const [photoUrl, setPhotoUrl] = useState(weighment?.photo_evidence_url || '');
  const [notes, setNotes] = useState(weighment?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  // Formula as required:
  // Net Weight = Gross Weight - Packaging Weight
  // Accepted Qty = Net Weight - Rejected Qty
  // Final Amount = Accepted Qty * Agreed Price
  const gross = parseFloat(grossWeight) || 0;
  const packaging = parseFloat(packagingWeight) || 0;
  const net = Math.max(0, gross - packaging);
  const rejected = parseFloat(rejectedQty) || 0;
  const accepted = Math.max(0, net - rejected);
  const unitPrice = parseFloat(order.agreed_price_per_kg) || 0;
  const finalPayable = (accepted * unitPrice).toFixed(2);

  const isConfirmed = weighment?.farmer_confirmed && weighment?.buyer_confirmed;

  const handleSaveWeighment = async (e) => {
    e.preventDefault();
    setError(null);
    if (gross <= 0) {
      setError("Gross weight must be greater than 0.");
      return;
    }
    if (gross < packaging) {
      setError("Gross weight cannot be less than packaging weight.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/orders/${order.id}/weighment`, {
        gross_weight: gross,
        packaging_weight: packaging,
        rejected_quantity: rejected,
        quality_grade: qualityGrade,
        scale_slip_number: scaleSlipNo || null,
        photo_evidence_url: photoUrl || null,
        notes: notes || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to record weighment.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${order.id}/weighment/confirm`, { confirm: true });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to confirm weighment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold">Order Weighment & Quality Verification</h3>
              <p className="text-xs text-emerald-200">
                Order #{order.order_number} • Agreed: {order.agreed_quantity} kg @ ₹{order.agreed_price_per_kg}/kg
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isConfirmed && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Mutually Confirmed & Audit-Locked! Neither party can modify this transaction.</span>
            </div>
          )}

          {/* Transparent Weighment Math Cards */}
          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Net Weight</span>
              <p className="text-sm font-extrabold text-gray-900">{net.toFixed(1)} kg</p>
              <span className="text-[9px] text-gray-400">Gross - Tare</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase">Accepted Qty</span>
              <p className="text-sm font-extrabold text-emerald-700">{accepted.toFixed(1)} kg</p>
              <span className="text-[9px] text-gray-400">Net - Rejected</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-800 font-bold uppercase">Final Payable</span>
              <p className="text-base font-black text-amber-700">₹{parseFloat(finalPayable).toLocaleString('en-IN')}</p>
              <span className="text-[9px] text-gray-400">{accepted.toFixed(1)} × ₹{unitPrice}</span>
            </div>
          </div>

          <form onSubmit={handleSaveWeighment} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gross Scale Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isConfirmed}
                  required
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tare / Packaging Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isConfirmed}
                  value={packagingWeight}
                  onChange={(e) => setPackagingWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rejected Quantity (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isConfirmed}
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quality Grade Assessed</label>
                <select
                  disabled={isConfirmed}
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:bg-gray-100"
                >
                  <option value="Grade A">Grade A (Premium / Export)</option>
                  <option value="Grade B">Grade B (Standard Market)</option>
                  <option value="Grade C">Grade C (Processing / Juice)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Weighbridge / Scale Slip Ref</label>
                <input
                  type="text"
                  disabled={isConfirmed}
                  value={scaleSlipNo}
                  onChange={(e) => setScaleSlipNo(e.target.value)}
                  placeholder="e.g. WB-MND-4491"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Photo Evidence URL</label>
                <input
                  type="url"
                  disabled={isConfirmed}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Moisture & Trash Test</label>
              <textarea
                rows={2}
                disabled={isConfirmed}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Scale certified. Moisture tested at 11%."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs disabled:bg-gray-100"
              />
            </div>

            {/* Confirmation status pill */}
            <div className="p-3 bg-gray-50 rounded-xl text-xs flex items-center justify-between border border-gray-200">
              <span className="flex items-center gap-1.5 font-medium">
                Farmer Confirmed: {weighment?.farmer_confirmed ? <span className="text-emerald-700 font-bold">YES</span> : <span className="text-amber-600 font-bold">PENDING</span>}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                Buyer Confirmed: {weighment?.buyer_confirmed ? <span className="text-emerald-700 font-bold">YES</span> : <span className="text-amber-600 font-bold">PENDING</span>}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>

              {!isConfirmed && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold"
                >
                  Save / Update Readings
                </button>
              )}

              {weighment && !isConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow"
                >
                  Confirm My Verification
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default WeighmentModal;
