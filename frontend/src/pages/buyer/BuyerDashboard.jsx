import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DemoBadge from '../../components/DemoBadge';
import {
  Store,
  ShoppingBag,
  Inbox,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  Scale,
  ShieldCheck,
  AlertCircle,
  X,
  FileText,
  Clock,
  Printer
} from 'lucide-react';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'offers', 'orders', 'payments', 'profile'
  const [metrics, setMetrics] = useState({
    available_produce: 0,
    active_offers: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_purchases: 0
  });

  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Counter Respond Modal
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [respondAction, setRespondAction] = useState('accept');
  const [reCounterPrice, setReCounterPrice] = useState('');
  const [reCounterQty, setReCounterQty] = useState('');
  const [reCounterMsg, setReCounterMsg] = useState('');

  // Weighment Record Modal (Section 14)
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [activeOrderForWeigh, setActiveOrderForWeigh] = useState(null);
  const [weighGross, setWeighGross] = useState('');
  const [weighPackaging, setWeighPackaging] = useState('20');
  const [weighAccepted, setWeighAccepted] = useState('');
  const [weighRejected, setWeighRejected] = useState('0');
  const [weighRejectionReason, setWeighRejectionReason] = useState('');
  const [scaleType, setScaleType] = useState('APMC Electronic Platform Scale (Class III)');
  const [scaleSlipUrl, setScaleSlipUrl] = useState('https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600');
  const [weighError, setWeighError] = useState('');

  // Payment Modal (Section 15)
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeOrderForPay, setActiveOrderForPay] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payStage, setPayStage] = useState('full');
  const [payMethod, setPayMethod] = useState('upi');
  const [payNotes, setPayNotes] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const loadBuyerData = async () => {
    try {
      const [mRes, oRes, ordRes, pRes] = await Promise.all([
        client.get('/buyer/metrics'),
        client.get('/buyer/offers'),
        client.get('/buyer/orders'),
        client.get('/payments/history')
      ]);
      setMetrics(mRes.data);
      setOffers(oRes.data);
      setOrders(ordRes.data);
      setPayments(pRes.data);
    } catch (err) {
      console.error("Buyer dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyerData();
  }, []);

  // Delivery confirmation
  const handleConfirmDelivery = async (orderId) => {
    try {
      const res = await client.post(`/buyer/orders/${orderId}/confirm-delivery`);
      setStatusMsg(res.data.message);
      loadBuyerData();
    } catch (err) {
      alert("Failed to confirm delivery");
    }
  };

  // Open Weighment Modal
  const openWeighModal = (order) => {
    setActiveOrderForWeigh(order);
    setWeighGross(order.quantity.toString());
    setWeighPackaging('20');
    setWeighAccepted((order.quantity - 20).toString());
    setWeighRejected('0');
    setWeighRejectionReason('');
    setWeighError('');
    setShowWeighModal(true);
  };

  const handleRecordWeighment = async (e) => {
    e.preventDefault();
    setWeighError('');
    const gross = parseFloat(weighGross);
    const packaging = parseFloat(weighPackaging) || 0;
    const accepted = parseFloat(weighAccepted);
    const rejected = parseFloat(weighRejected) || 0;

    const net = gross - packaging;
    if (net <= 0) {
      setWeighError("Gross weight must be greater than packaging/tare weight");
      return;
    }
    if (accepted > net) {
      setWeighError(`Accepted quantity (${accepted}) cannot exceed calculated net weight (${net})`);
      return;
    }

    try {
      await client.post(`/buyer/orders/${activeOrderForWeigh.id}/record-weighment`, {
        gross_weight: gross,
        packaging_weight: packaging,
        accepted_quantity: accepted,
        rejected_quantity: rejected,
        rejection_reason: weighRejectionReason || null,
        scale_type: scaleType,
        weighment_slip_photo_url: scaleSlipUrl,
        produce_photo_url: activeOrderForWeigh.produce?.images?.[0]?.image_url || null
      });

      setStatusMsg("Weighment slip submitted and calculated. Awaiting farmer confirmation.");
      setShowWeighModal(false);
      loadBuyerData();
    } catch (err) {
      setWeighError(err.response?.data?.detail || "Failed to record weighment");
    }
  };

  // Open Payment Modal
  const openPayModal = (order) => {
    setActiveOrderForPay(order);
    const payable = order.final_payable_amount || order.initial_total_amount;
    const remaining = payable - (order.advance_amount_paid || 0);
    setPayAmount(remaining.toString());
    setPayStage(order.advance_amount_paid > 0 ? 'final_balance' : 'full');
    setPayMethod('upi');
    setPayNotes('');
    setReceiptData(null);
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post('/payments/process', {
        order_id: activeOrderForPay.id,
        amount: parseFloat(payAmount),
        payment_stage: payStage,
        payment_method: payMethod,
        notes: payNotes || null
      });

      setReceiptData(res.data);
      setStatusMsg("Payment processed successfully with auditable receipt.");
      loadBuyerData();
    } catch (err) {
      alert(err.response?.data?.detail || "Payment failed");
    }
  };

  // Responding to counter-offer
  const handleRespondCounter = async (e) => {
    e.preventDefault();
    try {
      await client.post(`/buyer/offers/${selectedOffer.id}/counter-respond?action=${respondAction}`, 
        respondAction === 'counter' ? {
          counter_price_per_unit: parseFloat(reCounterPrice),
          counter_quantity: parseFloat(reCounterQty),
          message: reCounterMsg
        } : null
      );
      setShowRespondModal(false);
      setStatusMsg("Response transmitted to farmer");
      loadBuyerData();
    } catch (err) {
      alert("Failed to send response");
    }
  };

  // Calculations for current weigh modal
  const calcGross = parseFloat(weighGross) || 0;
  const calcPkg = parseFloat(weighPackaging) || 0;
  const calcNet = Math.max(0, calcGross - calcPkg);
  const calcAcc = parseFloat(weighAccepted) || 0;
  const calcPayable = activeOrderForWeigh ? calcAcc * activeOrderForWeigh.agreed_price_per_unit : 0;

  return (
    <div className="min-h-screen bg-[#F8FAF6] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t('buyer_dashboard')}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              user?.buyer_profile?.verification_status === 'verified'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {user?.buyer_profile?.verification_status === 'verified' ? '✓ Verified Commercial Buyer' : 'Pending Verification'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {user?.full_name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Business: <strong>{user?.buyer_profile?.business_name || "Commercial Wholesaler"}</strong> • {user?.buyer_profile?.business_type} • {user?.district}
          </p>
        </div>

        <Link
          to="/marketplace"
          className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse Marketplace</span>
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between">
          <span>✓ {statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('available_stock')}</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.available_produce} <span className="text-xs font-normal">crops</span></div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('my_offers')}</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{metrics.active_offers}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('pending_orders')}</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{metrics.pending_orders}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('completed_orders')}</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{metrics.completed_orders}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-gray-500 font-semibold">{t('total_purchases')}</div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">₹{metrics.total_purchases.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Store },
          { id: 'offers', label: `${t('my_offers')} (${offers.length})`, icon: Inbox },
          { id: 'orders', label: `${t('buyer_orders')} (${orders.length})`, icon: Truck },
          { id: 'payments', label: `${t('buyer_payments')} (${payments.length})`, icon: CreditCard },
          { id: 'profile', label: `${t('business_profile')}`, icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Offers */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-700" />
                <span>Your Active Purchase Offers</span>
              </h3>
              <button onClick={() => setActiveTab('offers')} className="text-xs text-emerald-800 font-bold hover:underline">
                View All →
              </button>
            </div>

            {offers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                You haven't made any offers yet. Explore produce to start bidding!
              </div>
            ) : (
              <div className="space-y-3">
                {offers.slice(0, 3).map((o) => (
                  <div key={o.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{o.produce?.crop_name}</h4>
                      <p className="text-[11px] text-gray-500">
                        Offered: ₹{o.current_agreed_price || o.offered_price_per_unit}/{o.produce?.unit} for {o.current_agreed_quantity || o.requested_quantity} {o.produce?.unit}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      o.status === 'accepted' || o.status === 'converted_to_order'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.status === 'countered'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Dispatches & In Transit */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Pending Deliveries & Weighment</span>
              </h3>
              <button onClick={() => setActiveTab('orders')} className="text-xs text-emerald-800 font-bold hover:underline">
                View All →
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No orders in transit right now.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-900">{ord.order_number}</span>
                      <p className="text-xs font-bold text-gray-900">{ord.quantity} {ord.produce?.unit} • {ord.produce?.crop_name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY OFFERS & NEGOTIATION */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Offers & Counter-Negotiations</h3>
              <p className="text-xs text-gray-500">Track farmer responses to your purchase proposals</p>
            </div>
            <DemoBadge text="LIVE NEGOTIATION" />
          </div>

          {offers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No offers found. Browse produce to place an offer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-gray-900">{offer.produce?.crop_name}</h4>
                        <p className="text-xs text-gray-500">Farmer Asking: ₹{offer.produce?.asking_price_per_unit}/{offer.produce?.unit}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        offer.status === 'accepted' || offer.status === 'converted_to_order'
                          ? 'bg-emerald-100 text-emerald-800'
                          : offer.status === 'countered'
                          ? 'bg-amber-100 text-amber-800'
                          : offer.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {offer.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <span className="text-gray-500">Offered Quantity:</span>
                        <div className="font-extrabold text-gray-900 text-sm mt-0.5">
                          {offer.current_agreed_quantity || offer.requested_quantity} {offer.produce?.unit}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Offered Price:</span>
                        <div className="font-extrabold text-emerald-800 text-sm mt-0.5">
                          ₹{offer.current_agreed_price || offer.offered_price_per_unit}/{offer.produce?.unit}
                        </div>
                      </div>
                    </div>

                    {/* Negotiation history */}
                    {offer.negotiation_history?.length > 0 && (
                      <div className="mt-3 text-xs space-y-1.5 pt-2 border-t border-gray-100">
                        <span className="font-bold text-gray-700 block">Conversation:</span>
                        {offer.negotiation_history.map((n) => (
                          <div key={n.id} className="text-[11px] text-gray-600 bg-gray-100/70 p-2 rounded-lg">
                            <span className="font-bold">{n.sender_id === user?.id ? "You" : "Farmer"}:</span> ₹{n.counter_price_per_unit}/{offer.produce?.unit} for {n.counter_quantity} {offer.produce?.unit} — {n.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {offer.status === 'countered' && (
                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setRespondAction('accept');
                          setShowRespondModal(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                      >
                        Accept Counter
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setRespondAction('counter');
                          setReCounterPrice(offer.current_agreed_price || offer.offered_price_per_unit);
                          setReCounterQty(offer.current_agreed_quantity || offer.requested_quantity);
                          setShowRespondModal(true);
                        }}
                        className="flex-1 py-2 rounded-xl border border-emerald-800 text-emerald-900 font-bold text-xs"
                      >
                        Re-Counter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDERS & DIGITAL WEIGHMENT (SECTION 13 & 14) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Purchase Orders & Certified Weighment</h3>
              <p className="text-xs text-gray-500">Record digital platform scale measurements and settle orders transparently</p>
            </div>
            <DemoBadge text="ESCROW & AUDIT" />
          </div>

          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No orders placed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-800">{ord.order_number}</span>
                      <h4 className="font-extrabold text-base text-gray-900">
                        {ord.quantity} {ord.produce?.unit} of {ord.produce?.crop_name}
                      </h4>
                      <p className="text-xs text-gray-500">Agreed Rate: ₹{ord.agreed_price_per_unit}/{ord.produce?.unit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                        {ord.status.replace('_', ' ')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                        {ord.payment_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      {ord.status !== 'delivered' && ord.status !== 'completed' && ord.status !== 'verification_completed' && (
                        <button
                          onClick={() => handleConfirmDelivery(ord.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-700"
                        >
                          Confirm Delivery Receipt
                        </button>
                      )}

                      {!ord.weighment_record ? (
                        <button
                          onClick={() => openWeighModal(ord)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center gap-1.5"
                        >
                          <Scale className="w-4 h-4" />
                          <span>Record Scale Weighment</span>
                        </button>
                      ) : (
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Weighment Slip Recorded
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">Final Payable:</div>
                        <div className="text-lg font-extrabold text-emerald-800">
                          ₹{(ord.final_payable_amount || ord.initial_total_amount).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {ord.payment_status !== 'fully_paid' && (
                        <button
                          onClick={() => openPayModal(ord)}
                          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          Pay Settlement
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weighment Slip Display */}
                  {ord.weighment_record && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-emerald-700" />
                          <span>Mutual Scale Weighment Record (Section 14 Audit)</span>
                        </span>
                        <DemoBadge text="APMC VERIFIED" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-emerald-100 font-mono">
                        <div>
                          <span className="text-gray-500">Gross Scale Weight:</span>
                          <div className="font-bold text-gray-900">{ord.weighment_record.gross_weight} kg</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Packaging Tare:</span>
                          <div className="font-bold text-gray-900">-{ord.weighment_record.packaging_weight} kg</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Net Weight:</span>
                          <div className="font-bold text-emerald-900">{ord.weighment_record.net_weight} kg</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Accepted Qty:</span>
                          <div className="font-bold text-emerald-800">{ord.weighment_record.accepted_quantity} kg</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
                        <span>Scale: {ord.weighment_record.scale_type}</span>
                        <span>
                          Settlement: <strong>{ord.weighment_record.accepted_quantity} kg × ₹{ord.agreed_price_per_unit} = ₹{ord.weighment_record.calculated_final_amount.toLocaleString('en-IN')}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYMENTS & RECEIPTS (SECTION 15) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Purchase Payment Receipts & Proof of Settlement</h3>
              <p className="text-xs text-gray-500">Simulated transactions with full cryptographic references and download links</p>
            </div>
            <DemoBadge text="MOCK GATEWAY DEMO" />
          </div>

          {payments.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No payments made yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-4">Transaction Reference</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-bold text-emerald-900">{p.receipt_number}</td>
                      <td className="py-3 px-4 text-gray-500">{p.transaction_reference}</td>
                      <td className="py-3 px-4 font-sans capitalize">{p.payment_stage.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-sans uppercase font-bold text-gray-700">{p.payment_method}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-800 text-sm">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-sans">
                        <DemoBadge text={p.is_demo ? "DEMO TRANSACTION" : "CONFIRMED"} />
                      </td>
                      <td className="py-3 px-4 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-base text-gray-900">Commercial Buyer Credentials</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              user?.buyer_profile?.verification_status === 'verified'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {user?.buyer_profile?.verification_status || 'Pending'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-500">Business Name:</span>
              <p className="font-bold text-gray-900 text-sm">{user?.buyer_profile?.business_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Business Category & Type:</span>
              <p className="font-bold text-gray-900">{user?.buyer_profile?.buyer_category} • {user?.buyer_profile?.business_type}</p>
            </div>
            <div>
              <span className="text-gray-500">GSTIN / Business PAN:</span>
              <p className="font-mono font-bold text-gray-900">{user?.buyer_profile?.gstin_pan || "36AABCA1234F1Z5"}</p>
            </div>
            <div>
              <span className="text-gray-500">Operating Address:</span>
              <p className="font-medium text-gray-900">{user?.buyer_profile?.business_address}</p>
            </div>
          </div>
        </div>
      )}

      {/* WEIGHMENT MODAL (SECTION 14) */}
      {showWeighModal && activeOrderForPay === null && activeOrderForWeigh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                  <Scale className="w-5 h-5 text-emerald-700" />
                  <span>Record Platform Scale Weighment</span>
                </h3>
                <p className="text-xs text-gray-500">Section 14: Certified Scale Weighing & Tare Deduction</p>
              </div>
              <button onClick={() => setShowWeighModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {weighError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{weighError}</span>
              </div>
            )}

            <form onSubmit={handleRecordWeighment} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Order Quantity:</span>
                  <span className="font-bold">{activeOrderForWeigh.quantity} {activeOrderForWeigh.produce?.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agreed Price:</span>
                  <span className="font-bold">₹{activeOrderForWeigh.agreed_price_per_unit}/{activeOrderForWeigh.produce?.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gross Scale Weight (kg) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={weighGross}
                    onChange={(e) => {
                      setWeighGross(e.target.value);
                      const g = parseFloat(e.target.value) || 0;
                      const p = parseFloat(weighPackaging) || 0;
                      setWeighAccepted((Math.max(0, g - p)).toString());
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Packaging / Tare Weight (kg) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={weighPackaging}
                    onChange={(e) => {
                      setWeighPackaging(e.target.value);
                      const g = parseFloat(weighGross) || 0;
                      const p = parseFloat(e.target.value) || 0;
                      setWeighAccepted((Math.max(0, g - p)).toString());
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Automatic Formula Output Display */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Formula: Net Weight = Gross − Tare:</span>
                  <span className="font-bold text-gray-900">{calcNet} kg</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold border-t border-gray-200 pt-1">
                  <span>Final Payable = Accepted Net × Agreed Price:</span>
                  <span className="text-sm font-extrabold">₹{calcPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Accepted Quantity (kg) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={weighAccepted}
                    onChange={(e) => setWeighAccepted(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rejected Quantity (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={weighRejected}
                    onChange={(e) => setWeighRejected(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {parseFloat(weighRejected) > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rejection Reason *</label>
                  <input
                    type="text"
                    required
                    value={weighRejectionReason}
                    onChange={(e) => setWeighRejectionReason(e.target.value)}
                    placeholder="e.g. Broken crates, rot, excessive moisture..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Weighing Scale Model / Mandi Slip Details</label>
                <input
                  type="text"
                  value={scaleType}
                  onChange={(e) => setScaleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWeighModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Submit & Confirm Scale Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (SECTION 15) */}
      {showPayModal && activeOrderForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5 text-emerald-700" />
                  <span>Settle Agricultural Payment</span>
                </h3>
                <DemoBadge text="DEMO GATEWAY" />
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiptData ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-emerald-950 text-base">Payment Confirmed!</h4>
                  <p className="text-xs text-emerald-800">Funds credited to Farmer settlement account.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt No:</span>
                    <span className="font-bold text-gray-900">{receiptData.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction Ref:</span>
                    <span className="text-gray-900">{receiptData.transaction_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-800 text-sm">₹{receiptData.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode:</span>
                    <span className="uppercase text-gray-800">{receiptData.payment_method} ({receiptData.demo_badge_text})</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Ref:</span>
                    <span className="font-mono font-bold text-emerald-950">{activeOrderForPay.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payable:</span>
                    <span className="font-bold text-emerald-900">
                      ₹{(activeOrderForPay.final_payable_amount || activeOrderForPay.initial_total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="text-gray-800 font-medium">₹{(activeOrderForPay.advance_amount_paid || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Stage *</label>
                    <select
                      value={payStage}
                      onChange={(e) => setPayStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      <option value="full">Full Settlement</option>
                      <option value="advance">Advance Token</option>
                      <option value="final_balance">Final Balance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      <option value="upi">UPI / Instant Pay</option>
                      <option value="bank_transfer">NEFT / RTGS Bank Transfer</option>
                      <option value="escrow_wallet">Rythu Escrow Wallet</option>
                      <option value="cash_on_delivery">Mandi Cash on Delivery</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ℹ️ Section 15 Simulation: Processes instant settlement with DEMO transaction tracking code.
                </p>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Confirm & Settle ₹{parseFloat(payAmount || 0).toLocaleString('en-IN')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESPOND TO COUNTER MODAL */}
      {showRespondModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">Respond to Counter-Offer</h3>
              <button onClick={() => setShowRespondModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Farmer proposed: <strong>₹{selectedOffer.current_agreed_price}/{selectedOffer.produce?.unit}</strong> for {selectedOffer.current_agreed_quantity} {selectedOffer.produce?.unit}.
            </p>

            <form onSubmit={handleRespondCounter} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRespondAction('accept')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs ${
                    respondAction === 'accept' ? 'bg-emerald-800 text-white' : 'border border-gray-200 text-gray-700'
                  }`}
                >
                  Accept Terms
                </button>
                <button
                  type="button"
                  onClick={() => setRespondAction('counter')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs ${
                    respondAction === 'counter' ? 'bg-emerald-800 text-white' : 'border border-gray-200 text-gray-700'
                  }`}
                >
                  Re-Counter
                </button>
              </div>

              {respondAction === 'counter' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Price (₹/unit)</label>
                      <input
                        type="number"
                        step="any"
                        value={reCounterPrice}
                        onChange={(e) => setReCounterPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Qty</label>
                      <input
                        type="number"
                        step="any"
                        value={reCounterQty}
                        onChange={(e) => setReCounterQty(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Note</label>
                    <textarea
                      rows={2}
                      value={reCounterMsg}
                      onChange={(e) => setReCounterMsg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold"
                >
                  Confirm & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
