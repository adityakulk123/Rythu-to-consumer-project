import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DemoBadge from '../components/DemoBadge';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function MarketplacePage() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isBuyer } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [produceList, setProduceList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  // Selected produce for Detail & Offer Modal
  const [activeProduce, setActiveProduce] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  // Offer Form state
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDeliveryDate, setOfferDeliveryDate] = useState('');
  const [offerDeliveryMethod, setOfferDeliveryMethod] = useState('Buyer Pickup');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Load categories
  useEffect(() => {
    client.get('/buyer/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch produce listings
  const fetchProduce = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCat) params.append('category_id', selectedCat);
      if (selectedGrade) params.append('quality_grade', selectedGrade);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (sortBy) params.append('sort_by', sortBy);
      params.append('page', page);
      params.append('limit', 9);

      const res = await client.get(`/buyer/produce?${params.toString()}`);
      setProduceList(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);

      // Check if URL specifies a produce ID
      const targetId = searchParams.get('id');
      if (targetId && res.data.items.length > 0) {
        const found = res.data.items.find((i) => i.id === parseInt(targetId));
        if (found) {
          openOfferModal(found);
        }
      }
    } catch (err) {
      console.error("Produce fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduce();
  }, [search, selectedCat, selectedGrade, selectedDistrict, sortBy, page]);

  const openOfferModal = (produce) => {
    setActiveProduce(produce);
    setOfferQty(produce.available_quantity > 500 ? 500 : produce.available_quantity);
    setOfferPrice(produce.asking_price_per_unit);
    // default delivery date 3 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setOfferDeliveryDate(d.toISOString().split('T')[0]);
    setOfferDeliveryMethod(produce.delivery_options === 'pickup_only' ? 'Buyer Pickup' : 'Farmer Delivery');
    setOfferNotes('');
    setOfferError('');
    setOfferSuccess(false);
    setShowOfferModal(true);
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/marketplace');
      return;
    }
    if (!isBuyer) {
      setOfferError("Only verified Buyer accounts can place offers. Please login with a Buyer account (Demo: 9876543220 / Buyer@123).");
      return;
    }

    const qty = parseFloat(offerQty);
    const price = parseFloat(offerPrice);

    if (isNaN(qty) || qty <= 0) {
      setOfferError("Please enter a valid positive quantity");
      return;
    }
    if (qty > activeProduce.available_quantity) {
      setOfferError(`Requested quantity (${qty} ${activeProduce.unit}) exceeds remaining available stock of ${activeProduce.available_quantity} ${activeProduce.unit}`);
      return;
    }
    if (isNaN(price) || price <= 0) {
      setOfferError("Please enter a valid positive price per unit");
      return;
    }

    setOfferSubmitting(true);
    setOfferError('');

    try {
      await client.post('/buyer/offers', {
        produce_id: activeProduce.id,
        requested_quantity: qty,
        offered_price_per_unit: price,
        preferred_delivery_date: offerDeliveryDate,
        delivery_method: offerDeliveryMethod,
        additional_requirements: offerNotes,
      });

      setOfferSuccess(true);
      setTimeout(() => {
        setShowOfferModal(false);
        setOfferSuccess(false);
      }, 2500);
    } catch (err) {
      setOfferError(err.response?.data?.detail || "Failed to submit offer");
    } finally {
      setOfferSubmitting(false);
    }
  };

  const calculatedTotal = (parseFloat(offerQty) || 0) * (parseFloat(offerPrice) || 0);

  return (
    <div className="min-h-screen bg-[#F8FAF6] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Direct Agricultural Marketplace</span>
            <DemoBadge text="LIVE TRADING" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('marketplace_title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse verified farm produce listings. Compare prices and make direct offers to farmers.
          </p>
        </div>

        <div className="text-right text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{produceList.length}</span> of <span className="font-bold text-gray-900">{total}</span> available harvests
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search crop, variety, village, district..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* District filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
            >
              <option value="">All Districts (AP & Telangana)</option>
              <option value="Annamayya">Annamayya / Chittoor</option>
              <option value="Nalgonda">Nalgonda</option>
              <option value="West Godavari">West Godavari</option>
              <option value="Ranga Reddy">Ranga Reddy</option>
              <option value="Guntur">Guntur</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          {/* Quality Grade filter */}
          <div className="md:col-span-2">
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
            >
              <option value="">All Quality Grades</option>
              <option value="Grade A">Grade A</option>
              <option value="Organic Premium">Organic Premium</option>
              <option value="Grade B">Grade B</option>
              <option value="Grade C">Grade C</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
            >
              <option value="latest">{t('sort_latest')}</option>
              <option value="price_asc">{t('sort_price_low')}</option>
              <option value="price_desc">{t('sort_price_high')}</option>
              <option value="qty_desc">{t('sort_qty_high')}</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setSelectedCat(null);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCat === null
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all_categories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCat(cat.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCat === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Produce Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Fetching verified farm listings...</p>
        </div>
      ) : produceList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No produce listings found</h3>
          <p className="text-xs text-gray-500 mt-1">Try resetting your search query or filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCat(null);
              setSelectedGrade('');
              setSelectedDistrict('');
            }}
            className="mt-4 px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {produceList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group"
            >
              {/* Image & Badges */}
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={item.images?.[0]?.image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"}
                  alt={item.crop_name}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                />
                <div className="absolute top-2 left-2 bg-emerald-950/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                  {item.quality_grade}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                  {item.available_quantity.toLocaleString()} {item.unit} available
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-emerald-800 transition">
                        {item.crop_name}
                      </h3>
                      {item.variety && (
                        <p className="text-xs text-emerald-700 font-medium">{item.variety}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-extrabold text-emerald-800">₹{item.asking_price_per_unit}</span>
                      <span className="text-xs text-gray-500">/{item.unit}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                    {item.description || "Fresh harvested produce directly available from verified farmer."}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.village}, {item.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Harvest: {new Date(item.harvest_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {item.delivery_options === 'both'
                          ? 'Pickup & Farmer Delivery'
                          : item.delivery_options === 'pickup_only'
                          ? 'Buyer Pickup Only'
                          : 'Farmer Delivery Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-gray-400">Farmer:</span>{' '}
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      {item.farmer?.full_name} <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>

                  <button
                    onClick={() => openOfferModal(item)}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    {t('make_an_offer')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-gray-700 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* MAKE AN OFFER MODAL */}
      {showOfferModal && activeProduce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>Submit Formal Buyer Offer</span>
                  <DemoBadge text="NEGOTIATION" />
                </h3>
                <p className="text-xs text-emerald-200">{activeProduce.crop_name} • {activeProduce.village}</p>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offerSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-lg text-emerald-950">Offer Submitted Successfully!</h4>
                <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Farmer {activeProduce.farmer?.full_name} has received your proposal of ₹{offerPrice}/{activeProduce.unit} for {offerQty} {activeProduce.unit}. You will be notified when they accept or counter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} className="p-6 space-y-4">
                {offerError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{offerError}</span>
                  </div>
                )}

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs space-y-1 text-emerald-900">
                  <div className="flex justify-between">
                    <span>Farmer's Asking Price:</span>
                    <span className="font-bold">₹{activeProduce.asking_price_per_unit} / {activeProduce.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Stock:</span>
                    <span className="font-bold">{activeProduce.available_quantity.toLocaleString()} {activeProduce.unit}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/50">
                    💡 You can offer to buy a partial quantity or the full harvest.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Requested Quantity ({activeProduce.unit}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={activeProduce.available_quantity}
                      step="any"
                      value={offerQty}
                      onChange={(e) => setOfferQty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Offered Price (₹/{activeProduce.unit}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="any"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-600">Calculated Offer Value:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Preferred Delivery Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={offerDeliveryDate}
                      onChange={(e) => setOfferDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Delivery Method *
                    </label>
                    <select
                      value={offerDeliveryMethod}
                      onChange={(e) => setOfferDeliveryMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      <option value="Buyer Pickup">Buyer Pickup (At Farm Gate)</option>
                      <option value="Farmer Delivery">Farmer Delivery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Packaging / Quality Specifications
                  </label>
                  <textarea
                    rows={2}
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="e.g. Standard 25 kg crates, moisture below 12%, delivery time morning..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={offerSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {offerSubmitting ? "Submitting..." : "Send Offer to Farmer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
