import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import WeighmentModal from '../../components/WeighmentModal';
import DisputeModal from '../../components/DisputeModal';
import { 
  ShoppingBag, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Phone
} from 'lucide-react';

const FarmerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForWeighment, setSelectedOrderForWeighment] = useState(null);
  const [activeWeighment, setActiveWeighment] = useState(null);
  const [selectedOrderIdForDispute, setSelectedOrderIdForDispute] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
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

  const openWeighmentModal = async (order) => {
    try {
      const res = await api.get(`/orders/${order.id}/weighment`);
      setActiveWeighment(res.data);
    } catch (e) {
      setActiveWeighment(null);
    }
    setSelectedOrderForWeighment(order);
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">Manage Orders & Scale Weighment</h2>
        <p className="text-xs text-gray-500">Track delivery clearances and certify digital weighbridge readings</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading farmer orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-sm font-semibold text-gray-600">No confirmed orders yet.</p>
          <p className="text-xs text-gray-400 mt-1">Accept incoming buyer quotations to generate confirmed deals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            return (
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
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Agreed Total</span>
                    <span className="text-lg font-black text-emerald-800">
                      ₹{parseFloat(ord.total_estimated_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Buyer</span>
                    <p className="font-extrabold text-gray-900">{ord.buyer_business_name || ord.buyer_name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{ord.buyer_mobile || "Verified Contact"}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Agreed Quantity</span>
                    <p className="font-extrabold text-gray-900">{ord.agreed_quantity} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Price per Kg</span>
                    <p className="font-extrabold text-emerald-800">₹{ord.agreed_price_per_kg}/kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Logistics</span>
                    <p className="font-extrabold text-gray-900">{ord.delivery_method}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => openWeighmentModal(ord)}
                    className="px-4 py-2 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Scale className="w-4 h-4 text-[#E9C46A]" />
                    <span>{ord.has_weighment ? "View / Verify Weighment Slip" : "Log Certified Weighment"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedOrderIdForDispute(ord.id)}
                    className="px-3.5 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Report Dispute</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weighment Modal */}
      {selectedOrderForWeighment && (
        <WeighmentModal
          order={selectedOrderForWeighment}
          weighment={activeWeighment}
          isOpen={!!selectedOrderForWeighment}
          onClose={() => setSelectedOrderForWeighment(null)}
          onSuccess={loadOrders}
          currentUserRole="FARMER"
        />
      )}

      {/* Dispute Modal */}
      {selectedOrderIdForDispute && (
        <DisputeModal
          orderId={selectedOrderIdForDispute}
          isOpen={!!selectedOrderIdForDispute}
          onClose={() => setSelectedOrderIdForDispute(null)}
          onSuccess={loadOrders}
        />
      )}

    </div>
  );
};

export default FarmerOrdersPage;
