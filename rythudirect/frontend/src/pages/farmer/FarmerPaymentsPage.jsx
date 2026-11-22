import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, ShieldCheck, CheckCircle2, Clock, Receipt, FileText } from 'lucide-react';

const FarmerPaymentsPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadFarmerPayments();
  }, []);

  const loadFarmerPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer/orders');
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (orderId) => {
    try {
      const res = await api.get(`/payments/${orderId}/receipt`);
      setSelectedReceipt(res.data);
    } catch (e) {
      alert("Receipt not yet generated for this pending order.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">Payment Management & Escrow Records</h2>
        <p className="text-xs text-gray-500">Transparent payment milestones, verified disbursements, and official receipts</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading payment ledger...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-semibold text-gray-600">No payment records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1B4332] text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Crop & Buyer</th>
                  <th className="px-5 py-3.5 text-right">Agreed Value</th>
                  <th className="px-5 py-3.5">Escrow Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-800">{ord.order_number}</td>
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-gray-900">{ord.crop_name}</div>
                      <div className="text-[10px] text-gray-400">{ord.buyer_business_name || ord.buyer_name}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-800 text-sm">
                      ₹{parseFloat(ord.total_estimated_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.payment_status === 'FULLY_PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.payment_status === 'ADVANCE_PAID'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.payment_status || "PAYMENT_PENDING"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(ord.id)}
                        className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-200 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Official Receipt</span>
                <h3 className="font-black text-base text-gray-900">{selectedReceipt.receipt_number}</h3>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between font-sans text-gray-500"><span>Order:</span><span className="font-mono text-gray-900">{selectedReceipt.order_number}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Farmer:</span><span className="font-sans font-bold text-gray-900">{selectedReceipt.farmer_name}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Buyer:</span><span className="font-sans font-bold text-gray-900">{selectedReceipt.buyer_name}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Crop:</span><span className="font-sans font-bold text-gray-900">{selectedReceipt.crop_name}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Quantity:</span><span className="text-gray-900">{selectedReceipt.quantity} kg</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Agreed Price:</span><span className="text-gray-900">₹{selectedReceipt.unit_price}/kg</span></div>
              <div className="flex justify-between font-sans text-gray-900 font-bold border-t border-gray-200 pt-1.5"><span>Total Value:</span><span className="text-emerald-800">₹{parseFloat(selectedReceipt.total_amount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-sans text-emerald-700 font-bold"><span>Amount Disbursed:</span><span>₹{parseFloat(selectedReceipt.paid_amount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Method:</span><span className="font-sans">{selectedReceipt.payment_method}</span></div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-[#1B4332] text-white font-bold rounded-xl text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FarmerPaymentsPage;
