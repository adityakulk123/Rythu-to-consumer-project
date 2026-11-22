import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DemoBadge from '../../components/DemoBadge';
import {
  Sprout,
  Package,
  Layers,
  Inbox,
  Truck,
  IndianRupee,
  CheckCircle2,
  Clock,
  PlusCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit3,
  Scale,
  ShieldCheck,
  X,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'produce', 'offers', 'orders', 'payments'
  const [metrics, setMetrics] = useState({
    active_listings: 0,
    available_quantity: 0,
    orders_received: 0,
    pending_payments: 0,
    completed_sales: 0,
    total_earnings: 0,
  });

  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Produce Modal state
  const [showProduceModal, setShowProduceModal] = useState(false);
  const [editingProduceId, setEditingProduceId] = useState(null);
  const [produceForm, setProduceForm] = useState({
    crop_name: '',
    category_id: 1,
    variety: '',
    total_quantity: '',
    unit: 'kg',
    asking_price_per_unit: '',
    min_acceptable_price: '', // PRIVATE!
    harvest_date: new Date().toISOString().split('T')[0],
    available_until: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    quality_grade: 'Grade A',
    description: '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || 'Andhra Pradesh',
    delivery_options: 'both',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'
  });
  const [formError, setFormError] = useState('');

  // Counter Offer Modal state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Status message
  const [statusMsg, setStatusMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      const [mRes, lRes, oRes, ordRes, pRes, cRes] = await Promise.all([
        client.get('/farmer/metrics'),
        client.get('/farmer/produce'),
        client.get('/farmer/offers'),
        client.get('/farmer/orders'),
        client.get('/payments/history'),
        client.get('/buyer/categories')
      ]);
      setMetrics(mRes.data);
      setListings(lRes.data);
      setOffers(oRes.data);
      setOrders(ordRes.data);
      setPayments(pRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Produce Actions
  const handleSaveProduce = async (e) => {
    e.preventDefault();
    setFormError('');

    const asking = parseFloat(produceForm.asking_price_per_unit);
    const minPrice = parseFloat(produceForm.min_acceptable_price);
    const qty = parseFloat(produceForm.total_quantity);

    if (minPrice > asking) {
      setFormError("Minimum acceptable price cannot be higher than your asking price");
      return;
    }

    try {
      const payload = {
        ...produceForm,
        category_id: parseInt(produceForm.category_id),
        total_quantity: qty,
        asking_price_per_unit: asking,
        min_acceptable_price: minPrice,
        image_urls: produceForm.image_url ? [produceForm.image_url] : []
      };

      if (editingProduceId) {
        await client.put(`/farmer/produce/${editingProduceId}`, payload);
        setStatusMsg("Produce listing updated successfully");
      } else {
        await client.post('/farmer/produce', payload);
        setStatusMsg("New harvest listed successfully on marketplace");
      }

      setShowProduceModal(false);
      setEditingProduceId(null);
      loadDashboardData();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to save produce listing");
    }
  };

  const handleToggleListingStatus = async (item) => {
    const nextStatus = item.status === 'paused' ? 'active' : 'paused';
    try {
      await client.put(`/farmer/produce/${item.id}`, { status: nextStatus });
      loadDashboardData();
    } catch (err) {
      alert("Failed to toggle listing status");
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to remove this listing?")) return;
    try {
      await client.delete(`/farmer/produce/${id}`);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove listing");
    }
  };

  // Offer Actions
  const handleAcceptOffer = async (offerId) => {
    if (!window.confirm("Accepting this offer will immediately reserve stock and create a binding order. Proceed?")) return;
    try {
      const res = await client.post(`/farmer/offers/${offerId}/accept`);
      setStatusMsg(res.data.message);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to accept offer");
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm("Decline this offer?")) return;
    try {
      await client.post(`/farmer/offers/${offerId}/reject`);
      loadDashboardData();
    } catch (err) {
      alert("Failed to reject offer");
    }
  };

  const openCounterModal = (offer) => {
    setSelectedOffer(offer);
    setCounterPrice(offer.offered_price_per_unit);
    setCounterQty(offer.requested_quantity);
    setCounterMessage('');
    setShowCounterModal(true);
  };

  const handleSendCounter = async (e) => {
    e.preventDefault();
    try {
      await client.post(`/farmer/offers/${selectedOffer.id}/counter`, {
        counter_price_per_unit: parseFloat(counterPrice),
        counter_quantity: parseFloat(counterQty),
        message: counterMessage
      });
      setShowCounterModal(false);
      setStatusMsg("Counter-offer proposed to buyer");
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit counteroffer");
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await client.patch(`/farmer/orders/${orderId}/status?status_val=${newStatus}`);
      setStatusMsg(`Order updated to '${newStatus.replace('_', ' ')}'`);
      loadDashboardData();
    } catch (err) {
      alert("Failed to update order status");
    }
  };

  // Farmer confirms digital weighment
  const handleFarmerConfirmWeighment = async (orderId) => {
    try {
      const res = await client.post(`/farmer/orders/${orderId}/confirm-weighment`);
      setStatusMsg(res.data.message);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to confirm weighment");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('farmer_dashboard')}</span>
            <DemoBadge text="FARMER PORTAL" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Farm: <strong>{user?.farmer_profile?.farm_name || "Reddy Organic Farms"}</strong> • {user?.village}, {user?.district}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduceId(null);
            setProduceForm({
              crop_name: '',
              category_id: categories[0]?.id || 1,
              variety: '',
              total_quantity: '',
              unit: 'kg',
              asking_price_per_unit: '',
              min_acceptable_price: '',
              harvest_date: new Date().toISOString().split('T')[0],
              available_until: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              quality_grade: 'Grade A',
              description: '',
              village: user?.village || '',
              district: user?.district || '',
              state: user?.state || 'Andhra Pradesh',
              delivery_options: 'both',
              image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'
            });
            setShowProduceModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('add_produce_btn')}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between">
          <span>✓ {statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('active_listings')}</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.active_listings}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('available_stock')}</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{metrics.available_quantity.toLocaleString()} <span className="text-xs font-normal">kg</span></div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('orders_received')}</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.orders_received}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('completed_sales')}</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{metrics.completed_sales}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('pending_payments')}</div>
          <div className="text-xl font-extrabold text-amber-700 mt-1">₹{metrics.pending_payments.toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('total_earnings')}</div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">₹{metrics.total_earnings.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'produce', label: `${t('my_produce')} (${listings.length})`, icon: Sprout },
          { id: 'offers', label: `${t('buyer_offers')} (${offers.length})`, icon: Inbox },
          { id: 'orders', label: `${t('farmer_orders')} (${orders.length})`, icon: Truck },
          { id: 'payments', label: `${t('farmer_payments')} (${payments.length})`, icon: IndianRupee },
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
          {/* Recent Pending Offers */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-700" />
                <span>Pending Buyer Offers Needing Action</span>
              </h3>
              <button onClick={() => setActiveTab('offers')} className="text-xs text-emerald-800 font-bold hover:underline">
                View All →
              </button>
            </div>

            {offers.filter(o => o.status === 'pending').length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No new pending offers right now. All caught up!
              </div>
            ) : (
              <div className="space-y-3">
                {offers.filter(o => o.status === 'pending').slice(0, 3).map((o) => (
                  <div key={o.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-xs text-gray-900">{o.produce?.crop_name}</span>
                        <p className="text-[11px] text-gray-500">Buyer: {o.buyer?.full_name} ({o.buyer?.business_name})</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-800">₹{o.offered_price_per_unit}</span>
                        <span className="text-[10px] text-gray-400">/{o.produce?.unit}</span>
                        <div className="text-[11px] font-semibold text-gray-700">{o.requested_quantity} {o.produce?.unit}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptOffer(o.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => openCounterModal(o)}
                        className="flex-1 py-1.5 rounded-lg border border-emerald-800 text-emerald-900 font-bold text-xs hover:bg-emerald-50"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => handleRejectOffer(o.id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders Status */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Active Dispatch & Orders</span>
              </h3>
              <button onClick={() => setActiveTab('orders')} className="text-xs text-emerald-800 font-bold hover:underline">
                View All →
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No orders yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-900">{ord.order_number}</span>
                        <p className="text-xs font-bold text-gray-900">{ord.quantity} {ord.produce?.unit} • ₹{ord.agreed_price_per_unit}/{ord.produce?.unit}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">Total: ₹{ord.initial_total_amount.toLocaleString('en-IN')}</span>
                      <span className="text-emerald-800 font-semibold">{ord.payment_status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY PRODUCE */}
      {activeTab === 'produce' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-sm text-gray-900">Your Agricultural Harvest Listings</h3>
            <button
              onClick={() => {
                setEditingProduceId(null);
                setShowProduceModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
            >
              + Add Produce
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Crop Name</th>
                  <th className="py-3 px-4">Total / Available Qty</th>
                  <th className="py-3 px-4">Asking Price</th>
                  <th className="py-3 px-4">Private Floor Price</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Active Offers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.crop_name}
                      {item.variety && <span className="block text-[11px] text-gray-500 font-normal">{item.variety}</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-900">
                      {item.available_quantity} / {item.total_quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">₹{item.asking_price_per_unit}/{item.unit}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-mono font-bold text-[11px] border border-purple-200" title="Confidential: Buyers cannot see this floor price">
                        🔒 ₹{item.min_acceptable_price}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.quality_grade}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'partially_sold'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'sold_out'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {item.active_offers_count || 0} offers
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleListingStatus(item)}
                        className="p-1 rounded-md text-gray-500 hover:text-gray-900"
                        title={item.status === 'paused' ? 'Activate Listing' : 'Pause Listing'}
                      >
                        {item.status === 'paused' ? <PlayCircle className="w-4 h-4 text-emerald-600" /> : <PauseCircle className="w-4 h-4 text-amber-600" />}
                      </button>
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-700"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BUYER OFFERS (SECTION 12: PRICE NEGOTIATION) */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Competitive Buyer Offers</h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Compare bids from multiple buyers side-by-side. You can accept, reject, or propose counter-offers.
              </p>
            </div>
            <DemoBadge text="NEGOTIATION ENGINE" />
          </div>

          {offers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No buyer offers received yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Offer for {offer.produce?.crop_name}
                        </span>
                        <h4 className="font-extrabold text-base text-gray-900 mt-0.5">
                          {offer.buyer?.full_name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {offer.buyer?.business_name} • {offer.buyer?.district}
                        </p>
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
                        <span className="text-gray-500">Requested Quantity:</span>
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
                      <div className="col-span-2 pt-2 border-t border-gray-200/60 flex justify-between">
                        <span className="text-gray-600 font-semibold">Total Value:</span>
                        <span className="font-extrabold text-gray-900">
                          ₹{((offer.current_agreed_quantity || offer.requested_quantity) * (offer.current_agreed_price || offer.offered_price_per_unit)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {offer.additional_requirements && (
                      <div className="mt-3 text-xs text-gray-600 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                        "{offer.additional_requirements}"
                      </div>
                    )}

                    {/* Negotiation History */}
                    {offer.negotiation_history?.length > 0 && (
                      <div className="mt-3 text-xs space-y-1.5 pt-2 border-t border-gray-100">
                        <span className="font-bold text-gray-700 block">Negotiation Trail:</span>
                        {offer.negotiation_history.map((n) => (
                          <div key={n.id} className="text-[11px] text-gray-600 bg-gray-100/70 p-2 rounded-lg">
                            <span className="font-bold">{n.sender_id === user?.id ? "You" : "Buyer"}:</span> ₹{n.counter_price_per_unit}/{offer.produce?.unit} for {n.counter_quantity} {offer.produce?.unit} — {n.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {offer.status === 'pending' || offer.status === 'countered' ? (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700 transition"
                      >
                        Accept & Lock Stock
                      </button>
                      <button
                        onClick={() => openCounterModal(offer)}
                        className="flex-1 py-2 rounded-xl border border-emerald-800 text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition"
                      >
                        Counter-Offer
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer.id)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 font-medium py-1">
                      Offer finalized ({offer.status})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDERS & WEIGHMENT VERIFICATION (SECTION 13 & 14) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Order Management & Digital Weighment Slips</h3>
              <p className="text-xs text-gray-500">Track shipments and counter-confirm weights measured on certified platform scales</p>
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

                  {/* Order Lifecycle Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <span className="text-gray-500">Update Shipment Stage:</span>
                      <div className="flex gap-2">
                        {['preparing', 'ready_for_pickup', 'in_transit', 'delivered'].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateOrderStatus(ord.id, st)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs capitalize cursor-pointer transition ${
                              ord.status === st
                                ? 'bg-emerald-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Settlement Total:</div>
                      <div className="text-lg font-extrabold text-emerald-800">
                        ₹{(ord.final_payable_amount || ord.initial_total_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* WEIGHMENT MODULE (SECTION 14) */}
                  {ord.weighment_record ? (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-emerald-700" />
                          <span>Digital Scale Weighment Verification (Section 14 Audit)</span>
                        </span>
                        <DemoBadge text="CERTIFIED WEIGHMENT" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-emerald-100 font-mono">
                        <div>
                          <span className="text-gray-500">Gross Weight:</span>
                          <div className="font-bold text-gray-900">{ord.weighment_record.gross_weight} kg</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tare / Packaging:</span>
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

                      {ord.weighment_record.rejected_quantity > 0 && (
                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded-md border border-red-200">
                          <strong>Deduction:</strong> {ord.weighment_record.rejected_quantity} kg rejected ({ord.weighment_record.rejection_reason})
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60 text-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Buyer Confirmed: {ord.weighment_record.buyer_confirmed ? "YES" : "Pending"}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Farmer Confirmed: {ord.weighment_record.farmer_confirmed ? "YES" : "Pending"}
                          </span>
                        </div>

                        {!ord.weighment_record.farmer_confirmed && (
                          <button
                            onClick={() => handleFarmerConfirmWeighment(ord.id)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Confirm Scale Record
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex items-center justify-between">
                      <span>Weighment record will be entered upon buyer delivery arrival.</span>
                      <span className="text-emerald-700 font-medium">Pending Delivery</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PAYMENTS & EARNINGS (SECTION 15) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Payment Transactions & Settlement Ledger</h3>
              <p className="text-xs text-gray-500">Every payment includes auditable digital transaction reference and receipt number</p>
            </div>
            <DemoBadge text="SETTLEMENTS" />
          </div>

          {payments.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No payment transactions yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-4">Transaction Ref</th>
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

      {/* ADD / EDIT PRODUCE MODAL */}
      {showProduceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-emerald-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">List Harvest Produce</h3>
                <p className="text-xs text-emerald-200">Set asking price and confidential floor price</p>
              </div>
              <button onClick={() => setShowProduceModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduce} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={produceForm.crop_name}
                    onChange={(e) => setProduceForm({ ...produceForm, crop_name: e.target.value })}
                    placeholder="e.g. Hybrid Tomatoes"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Category *</label>
                  <select
                    value={produceForm.category_id}
                    onChange={(e) => setProduceForm({ ...produceForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Quantity *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="1"
                    value={produceForm.total_quantity}
                    onChange={(e) => setProduceForm({ ...produceForm, total_quantity: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit *</label>
                  <select
                    value={produceForm.unit}
                    onChange={(e) => setProduceForm({ ...produceForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal (100kg)</option>
                    <option value="tonne">tonne (1000kg)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Section with Private Floor Price (Rule 13 & Section 9) */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Asking Price (₹/{produceForm.unit}) *
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0.1"
                      value={produceForm.asking_price_per_unit}
                      onChange={(e) => setProduceForm({ ...produceForm, asking_price_per_unit: e.target.value })}
                      placeholder="e.g. 25.0"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1">
                      <span>Private Floor Price *</span>
                      <span className="text-[10px] text-purple-600 font-normal">🔒 Confidential</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0.1"
                      value={produceForm.min_acceptable_price}
                      onChange={(e) => setProduceForm({ ...produceForm, min_acceptable_price: e.target.value })}
                      placeholder="e.g. 20.0"
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 text-sm bg-white focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-purple-800 leading-tight">
                  🛡️ <strong>Rule 13 Guarantee:</strong> Your Private Floor Price is strictly kept secret from buyers and will NEVER be shown in the marketplace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={produceForm.harvest_date}
                    onChange={(e) => setProduceForm({ ...produceForm, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Available Until *</label>
                  <input
                    type="date"
                    required
                    value={produceForm.available_until}
                    onChange={(e) => setProduceForm({ ...produceForm, available_until: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quality Grade *</label>
                  <select
                    value={produceForm.quality_grade}
                    onChange={(e) => setProduceForm({ ...produceForm, quality_grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="Grade A">Grade A</option>
                    <option value="Organic Premium">Organic Premium</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Delivery / Pickup *</label>
                  <select
                    value={produceForm.delivery_options}
                    onChange={(e) => setProduceForm({ ...produceForm, delivery_options: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="both">Both (Buyer Pickup & Delivery)</option>
                    <option value="pickup_only">Buyer Pickup Only</option>
                    <option value="delivery_available">Farmer Delivery Available</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Crop Image URL</label>
                <input
                  type="url"
                  value={produceForm.image_url}
                  onChange={(e) => setProduceForm({ ...produceForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={produceForm.description}
                  onChange={(e) => setProduceForm({ ...produceForm, description: e.target.value })}
                  placeholder="Color, ripeness, packaging crates or bags..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProduceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Save & Publish Produce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTER-OFFER MODAL */}
      {showCounterModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">Propose Counter-Offer</h3>
              <button onClick={() => setShowCounterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Buyer offered <strong>₹{selectedOffer.offered_price_per_unit}</strong> for {selectedOffer.requested_quantity} {selectedOffer.produce?.unit}. Propose your counter-terms:
            </p>

            <form onSubmit={handleSendCounter} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Counter Price (₹/unit) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Counter Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message to Buyer</label>
                <textarea
                  rows={2}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="e.g. Can deliver tomorrow morning if ₹17/kg is acceptable..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Submit Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
