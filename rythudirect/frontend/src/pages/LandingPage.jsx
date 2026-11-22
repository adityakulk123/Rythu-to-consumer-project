import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Sprout, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  DollarSign, 
  CheckCircle, 
  MapPin, 
  Truck, 
  Users, 
  Lock,
  PhoneCall,
  Sparkles,
  Calendar
} from 'lucide-react';

const LandingPage = () => {
  const { t, isTelugu } = useLanguage();
  const { isAuthenticated, isFarmer, isBuyer } = useAuth();
  const [featuredProduce, setFeaturedProduce] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduce = async () => {
      try {
        const res = await api.get('/buyer/produce?page_size=6');
        setFeaturedProduce(res.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadProduce();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1B4332] via-[#235841] to-[#2D6A4F] text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E9C46A_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/30 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Eliminating Middlemen • Protecting Farm Incomes</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            {t('heroHeadline')}
          </h1>

          <p className="text-base sm:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to={isAuthenticated ? (isFarmer ? "/farmer/dashboard" : "/buyer/dashboard") : "/register"}
              className="w-full sm:w-auto px-8 py-4 bg-[#E9C46A] hover:bg-[#F4A261] text-emerald-950 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-base flex items-center justify-center gap-2"
            >
              <span>{t('startSelling')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md border border-white/20 shadow-md transition-all text-base flex items-center justify-center gap-2"
            >
              <span>{t('exploreMarket')}</span>
            </Link>
          </div>

          {/* Quick Problem Solution Strip */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="bg-black/25 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-amber-300 font-extrabold text-sm block">100% Direct</span>
              <span className="text-xs text-emerald-100">Zero commission cuts</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-amber-300 font-extrabold text-sm block">Smart Quotations</span>
              <span className="text-xs text-emerald-100">Multiple competitive buyer bids</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-amber-300 font-extrabold text-sm block">Certified Tare</span>
              <span className="text-xs text-emerald-100">Transparent weighbridge slips</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-amber-300 font-extrabold text-sm block">Escrow Protection</span>
              <span className="text-xs text-emerald-100">Prompt delivery settlements</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. HOW RYTHUDIRECT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Transparent Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            How RythuDirect Empowers Every Harvest
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            From field harvest to certified weighbridge and instant escrow release, our platform ensures fair trade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1B4332] font-black text-xl flex items-center justify-center">
              1
            </div>
            <h3 className="font-extrabold text-base text-gray-900">List Produce with Private Reserve</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Farmer specifies crop details, quantity, asking price, and a private minimum threshold that buyers never see.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-black text-xl flex items-center justify-center">
              2
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Receive & Compare Bids</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Multiple verified wholesalers, retail chains, and processors submit purchase offers. Counter or accept partial lots.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1B4332] font-black text-xl flex items-center justify-center">
              3
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Certified Tare & Weighbridge</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Gross weight minus container tare weight yields verified Net Weight. Both farmer and buyer mutually confirm before lock.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-900 font-black text-xl flex items-center justify-center">
              4
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Escrow Direct Disbursement</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Buyer advance and final balance are cleared transparently with GST/APMC transaction receipts and zero payment delays.
            </p>
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              Live Farm Listings
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">
              Featured Agricultural Produce
            </h2>
            <p className="text-xs text-gray-500 mt-1">Available directly from verified farm gates</p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
          >
            <span>View All Produce</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-gray-200 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProduce.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-200/70 transition-all flex flex-col group"
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={p.images?.[0]?.image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600"}
                    alt={p.crop_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#1B4332]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {p.quality_grade}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                    {p.category_name}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-emerald-800 transition-colors">
                      {p.crop_name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.village}, {p.farmer?.district}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/60 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Stock Left</span>
                      <p className="font-black text-gray-900">{p.remaining_quantity} {p.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Asking Price</span>
                      <p className="font-black text-emerald-800 text-sm">₹{p.expected_price_per_kg}/kg</p>
                    </div>
                  </div>

                  <Link
                    to={`/produce/${p.id}`}
                    className="w-full text-center py-2.5 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View & Submit Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. DUAL BENEFITS: FARMERS & BUYERS */}
      <section className="bg-emerald-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold">Engineered for Fair Agricultural Commerce</h2>
            <p className="text-emerald-200 text-sm max-w-xl mx-auto">
              Real agricultural problems solved with software built around local farm realities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Farmer Benefits */}
            <div className="bg-emerald-950/70 p-8 rounded-3xl border border-emerald-700/60 space-y-4">
              <div className="inline-block bg-[#E9C46A] text-emerald-950 font-black text-xs px-3 py-1 rounded-full uppercase">
                For Farmers
              </div>
              <h3 className="text-xl font-black">Direct Farm-Gate Empowerment</h3>
              <ul className="space-y-3 text-xs text-emerald-100">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E9C46A] shrink-0 mt-0.5" />
                  <span><strong>Private Minimum Price:</strong> Buyers never know your bottom line, preserving your bargaining leverage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E9C46A] shrink-0 mt-0.5" />
                  <span><strong>Zero Weight Fraud:</strong> Certified weighbridge tare reading ensures crates and transport bags are not wrongly inflated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E9C46A] shrink-0 mt-0.5" />
                  <span><strong>Multiple Quotations:</strong> Split a 5,000 kg lot across two or three buyers at top market prices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E9C46A] shrink-0 mt-0.5" />
                  <span><strong>Guaranteed Escrow:</strong> Stop worrying about delayed payments or bouncing credit slips.</span>
                </li>
              </ul>
            </div>

            {/* Buyer Benefits */}
            <div className="bg-emerald-950/70 p-8 rounded-3xl border border-emerald-700/60 space-y-4">
              <div className="inline-block bg-white text-emerald-950 font-black text-xs px-3 py-1 rounded-full uppercase">
                For Buyers & Processors
              </div>
              <h3 className="text-xl font-black">Verified & Traceable Farm Procurement</h3>
              <ul className="space-y-3 text-xs text-emerald-100">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Source Traceability:</strong> Direct harvest procurement from verified village fields.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Consistent Quality Grades:</strong> Moisture, trash percentage and quality grades logged digitally.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Official Invoices:</strong> APMC and GST compliant digital receipts for institutional procurement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Fair Dispute Mediation:</strong> Rapid administrative arbitration for transit damage and mismatch.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 5. TESTIMONIALS (Clearly labelled sample content) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-200 px-3 py-1 rounded-full">
            Simulated Sample Testimonials
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">
            What Farmers & Buyers Are Experiencing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <p className="text-xs text-gray-600 italic">
              "Earlier, local commission agents in Jangaon took ₹2 per kg as commission and deducted 5kg per crate. On RythuDirect, I sold 1,500kg of tomatoes directly to a supermarket chain at ₹14/kg with certified tare."
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-900 block">Mallaiah Yadav</span>
              <span className="text-[10px] text-emerald-700 font-medium">Tomato & Paddy Farmer, Jangaon, Telangana</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <p className="text-xs text-gray-600 italic">
              "We procure 20 tonnes of Guntur Teja red chillies every season for our spice plant. Direct counter-offers and certified weighbridge slips saved us 15% in supply chain delays."
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-900 block">Deepak Agarwal</span>
              <span className="text-[10px] text-emerald-700 font-medium">Deccan Food Processing Industries, Guntur</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <p className="text-xs text-gray-600 italic">
              "The Telugu language option makes it simple for our village cooperative members to list Banganapalli mangoes directly from the orchard without depending on city agents."
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-900 block">Subba Rao Patrudu</span>
              <span className="text-[10px] text-emerald-700 font-medium">Mango Orchardist, Nuzvid, Andhra Pradesh</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
