import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MakeOfferModal from '../components/MakeOfferModal';
import { 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Truck, 
  Send, 
  CheckCircle2, 
  Lock, 
  ArrowLeft,
  Scale
} from 'lucide-react';

const ProduceDetailPage = () => {
  const { id } = useParams();
  const { user, isBuyer } = useAuth();
  const [produce, setProduce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerSuccessMessage, setOfferSuccessMessage] = useState(false);

  useEffect(() => {
    loadProduceDetail();
  }, [id]);

  const loadProduceDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/buyer/produce/${id}`);
      setProduce(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Loading produce details...
      </div>
    );
  }

  if (!produce) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-gray-600 text-sm">Produce listing not found or has expired.</p>
        <Link to="/explore" className="text-xs font-bold text-emerald-800 underline">
          &larr; Back to Produce Explorer
        </Link>
      </div>
    );
  }

  const images = produce.images?.length > 0 ? produce.images : [
    { id: 1, image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800", is_primary: true }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <div>
        <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore Produce</span>
        </Link>
      </div>

      {offerSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Your purchase offer was submitted successfully to the farmer!</span>
          </div>
          <Link to="/buyer/offers" className="text-emerald-800 underline">
            Track in My Quotations &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
        
        {/* Left: Photographs Gallery */}
        <div className="space-y-4">
          <div className="h-96 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
            <img
              src={images[activeImageIndex]?.image_url}
              alt={produce.crop_name}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Privacy Protection Notice */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Farmer Privacy Protected:</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                The farmer's confidential minimum reserve price is safeguarded by the platform and never revealed to buyers.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Produce Details & Action */}
        <div className="flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            
            <div className="flex items-center gap-2">
              <span className="bg-[#1B4332] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                {produce.quality_grade}
              </span>
              <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-3 py-1 rounded-full">
                {produce.category_name}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full">
                {produce.status}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {produce.crop_name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold">{produce.village}, {produce.farmer?.district}, {produce.farmer?.state}</span>
            </div>

            {/* Pricing Box */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Farmer's Asking Price
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-[#1B4332]">₹{produce.expected_price_per_kg}</span>
                  <span className="text-xs text-gray-500 font-semibold">/ kg</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Available Stock
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-gray-900">{produce.remaining_quantity}</span>
                  <span className="text-xs text-gray-500 font-semibold">{produce.unit}</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Harvest Date</span>
                <span className="font-extrabold text-gray-800">{produce.harvest_date}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Available Until</span>
                <span className="font-extrabold text-gray-800">{produce.available_until}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Logistics Pickup</span>
                <span className="font-extrabold text-emerald-700">
                  {produce.pickup_available ? "Farm Gate Pickup Available" : "Not available"}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Direct Delivery</span>
                <span className="font-extrabold text-emerald-700">
                  {produce.delivery_available ? "Field Delivery Available" : "Buyer Transport Needed"}
                </span>
              </div>
            </div>

            {/* Description */}
            {produce.description && (
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1">Produce Description</span>
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {produce.description}
                </p>
              </div>
            )}

            {/* Farmer Profile Card */}
            {produce.farmer && (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Cultivated By</span>
                  <h4 className="text-sm font-black text-gray-900">{produce.farmer.full_name}</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {produce.farmer.farm_name || "Verified Local Producer"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm">
                  {produce.farmer.full_name.charAt(0)}
                </div>
              </div>
            )}

          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-100">
            {isBuyer ? (
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="w-full py-4 bg-[#1B4332] hover:bg-emerald-800 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4 text-[#E9C46A]" />
                <span>Make a Purchase Offer</span>
              </button>
            ) : user ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-900 font-semibold">
                Logged in as {user.role}. Only registered buyers can submit purchase offers.
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full py-4 bg-[#1B4332] hover:bg-emerald-800 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Login as Buyer to Make an Offer</span>
              </Link>
            )}
          </div>

        </div>

      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        produce={produce}
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSuccess={() => {
          setOfferSuccessMessage(true);
          loadProduceDetail();
        }}
      />

    </div>
  );
};

export default ProduceDetailPage;
