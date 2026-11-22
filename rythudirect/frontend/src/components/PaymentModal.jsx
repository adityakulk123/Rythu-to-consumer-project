import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [paymentType, setPaymentType] = useState('FULL');
  const [paymentMethod, setPaymentMethod] = useState('ESCROW_MOCK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  if (!isOpen || !order) return null;

  const totalAmount = parseFloat(order.total_estimated_amount) || 0;
  const advanceAmount = Math.round(totalAmount * 0.20);
  const amountToPay = paymentType === 'ADVANCE' ? advanceAmount : totalAmount;

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/payments/process', {
        order_id: order.id,
        payment_type: paymentType,
        payment_method: paymentMethod,
      });

      // Fetch official receipt
      const receiptRes = await api.get(`/payments/${order.id}/receipt`);
      setSuccessReceipt(receiptRes.data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Payment processing failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold">Escrow Payment Gateway</h3>
              <p className="text-xs text-emerald-200">RythuDirect Verified Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successReceipt ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900">Payment Verified & Escrowed!</h4>
                <p className="text-xs text-gray-500 mt-1">Receipt #{successReceipt.receipt_number}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between"><span>Farmer:</span><span className="font-bold">{successReceipt.farmer_name}</span></div>
                <div className="flex justify-between"><span>Crop:</span><span>{successReceipt.crop_name}</span></div>
                <div className="flex justify-between"><span>Quantity:</span><span>{successReceipt.quantity} kg</span></div>
                <div className="flex justify-between"><span>Paid Amount:</span><span className="font-bold text-emerald-700">₹{parseFloat(successReceipt.paid_amount).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Status:</span><span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans text-[10px] font-bold">{successReceipt.payment_status}</span></div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#1B4332] text-white font-bold rounded-xl text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Milestone</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('ADVANCE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentType === 'ADVANCE'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs font-bold text-gray-900">Advance (20%)</span>
                    <span className="text-sm font-black text-emerald-700">₹{advanceAmount.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-gray-500 mt-1">Hold for harvest clearance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('FULL')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentType === 'FULL'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs font-bold text-gray-900">Full Amount (100%)</span>
                    <span className="text-sm font-black text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-gray-500 mt-1">Direct full escrow clearance</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
                >
                  <option value="ESCROW_MOCK">RythuDirect Digital Escrow (Simulated)</option>
                  <option value="UPI">UPI Instant (GPay / PhonePe / BHIM)</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                  <option value="CASH_ON_DELIVERY">Cash on Weighbridge Delivery</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                🛡️ <strong>Escrow Protection Notice:</strong> Funds are locked securely in the platform trust escrow and disbursed to the farmer upon mutual weighbridge confirmation.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                >
                  {loading ? "Processing..." : `Pay ₹${amountToPay.toLocaleString('en-IN')}`}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
