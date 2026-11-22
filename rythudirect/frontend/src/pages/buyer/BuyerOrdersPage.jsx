import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import WeighmentModal from '../../components/WeighmentModal';
import PaymentModal from '../../components/PaymentModal';
import DisputeModal from '../../components/DisputeModal';
import { 
  ShoppingBag, 
  Scale, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt,
  Phone
} from 'lucide-react';

const BuyerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrderForWeighment, setSelectedOrderForWeighment] = useState(null);
  const [activeWeighment, setActiveWeighment] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [selectedOrderIdForDispute, setSelectedOrderIdForDispute] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    loadBuyerOrders();
  }, []);

  const loadBuyerOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/buyer/orders');
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openWeighmentModal = async (order) => {
    try {
      const res = await api.get(`/orders/${order.id}/weighment`);
      setActiveWeighment(res.data);
    } catch (e) {
      setActiveWeighment(null);
    }
    setSelectedOrderForWeighment(order);
  };

  const openReceipt = async (orderId) => {
    try {
      const res = await api.get(`/payments/${orderId}/receipt`);
      setReceiptData(res.data);
    } catch (e) {
      alert("Payment receipt not yet available.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">Procurement Orders & Payments</h2>
        <p className="text-xs text-gray-500">
          Verify digital tare scales, release milestone payments, and maintain APMC audit receipts
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading purchase orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-semibold text-gray-600">No purchase orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">{ord.order_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'DISPUTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-gray-900 mt-1">{ord.crop_name}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Estimated Amount</span>
                  <span className="text-lg font-black text-emerald-800">
                    ₹{parseFloat(ord.total_estimated_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Farmer</span>
                  <p className="font-extrabold text-gray-900">{ord.farmer_name}</p>
                  <p className="text-[10px] text-gray-500">{ord.farmer_village}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Agreed Quantity</span>
                  <p className="font-extrabold text-gray-900">{ord.agreed_quantity} kg</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Price</span>
                  <p className="font-extrabold text-emerald-800">₹{ord.agreed_price_per_kg}/kg</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Escrow Payment</span>
                  <p className={`font-bold ${
                    ord.payment_status === 'FULLY_PAID' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {ord.payment_status || "PAYMENT_PENDING"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {ord.payment_status !== 'FULLY_PAID' && (
                  <button
                    onClick={() => setSelectedOrderForPayment(ord)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Pay Advance / Full Escrow</span>
                  </button>
                )}

                <button
                  onClick={() => openWeighmentModal(ord)}
                  className="px-4 py-2 bg-[#1B4332] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                >
                  <Scale className="w-4 h-4 text-[#E9C46A]" />
                  <span>{ord.has_weighment ? "Verify Weighment & Tare" : "Log Weighment Slip"}</span>
                </button>

                {ord.payment_status && (
                  <button
                    onClick={() => openReceipt(ord.id)}
                    className="px-3 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Receipt</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrderIdForDispute(ord.id)}
                  className="px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Dispute</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedOrderForWeighment && (
        <WeighmentModal
          order={selectedOrderForWeighment}
          weighment={activeWeighment}
          isOpen={!!selectedOrderForWeighment}
          onClose={() => setSelectedOrderForWeighment(null)}
          onSuccess={loadBuyerOrders}
          currentUserRole="BUYER"
        />
      )}

      {selectedOrderForPayment && (
        <PaymentModal
          order={selectedOrderForPayment}
          isOpen={!!selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onSuccess={loadBuyerOrders}
        />
      )}

      {selectedOrderIdForDispute && (
        <DisputeModal
          orderId={selectedOrderIdForDispute}
          isOpen={!!selectedOrderIdForDispute}
          onClose={() => setSelectedOrderIdForDispute(null)}
          onSuccess={loadBuyerOrders}
        />
      )}

      {/* Official Receipt Dialog */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-200 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Official Receipt</span>
                <h3 className="font-black text-base text-gray-900">{receiptData.receipt_number}</h3>
              </div>
              <button onClick={() => setReceiptData(null)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between font-sans text-gray-500"><span>Order:</span><span className="font-mono text-gray-900">{receiptData.order_number}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Farmer:</span><span className="font-sans font-bold text-gray-900">{receiptData.farmer_name}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Crop:</span><span className="font-sans font-bold text-gray-900">{receiptData.crop_name}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Quantity:</span><span>{receiptData.quantity} kg</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Unit Price:</span><span>₹{receiptData.unit_price}/kg</span></div>
              <div className="flex justify-between font-sans text-gray-900 font-bold border-t border-gray-200 pt-1.5"><span>Total Value:</span><span className="text-emerald-800">₹{parseFloat(receiptData.total_amount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-sans text-emerald-700 font-bold"><span>Amount Paid:</span><span>₹{parseFloat(receiptData.paid_amount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-sans text-gray-500"><span>Method:</span><span className="font-sans">{receiptData.payment_method}</span></div>
            </div>
            <button
              onClick={() => setReceiptData(null)}
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

export default BuyerOrdersPage;
