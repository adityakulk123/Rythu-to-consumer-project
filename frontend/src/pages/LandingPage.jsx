import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DemoBadge from '../components/DemoBadge';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  Scale,
  HandCoins,
  TrendingUp,
  Truck,
  CheckCircle2,
  Users,
  Store,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const { isAuthenticated, isFarmer, isBuyer } = useAuth();
  const [featuredProduce, setFeaturedProduce] = useState([]);
  const [marketRates, setMarketRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [prodRes, ratesRes] = await Promise.all([
          client.get('/buyer/produce?limit=6&sort_by=latest'),
          client.get('/market-prices/')
        ]);
        setFeaturedProduce(prodRes.data.items || []);
        setMarketRates(ratesRes.data.slice(0, 6) || []);
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF6]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-950 to-[#0e291b] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle agricultural background glow */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-xs font-semibold text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Zero Commission Middlemen • 100% Direct Trade</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                {t('hero_title')}
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100/90 max-w-2xl font-normal leading-relaxed">
                {t('hero_subtitle')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to={isFarmer ? "/farmer" : "/register"}
                  className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-base transition duration-200 shadow-lg shadow-emerald-900/40 flex items-center gap-2"
                >
                  <span>{t('start_selling')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/marketplace"
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-base transition duration-200 backdrop-blur-xs flex items-center gap-2"
                >
                  <span>{t('browse_produce')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Pillars */}
              <div className="pt-8 border-t border-emerald-800/60 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-2xl font-extrabold text-amber-300">100%</div>
                  <div className="text-emerald-200/80 mt-0.5">Scale & Weighment Transparency</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-300">₹0</div>
                  <div className="text-emerald-200/80 mt-0.5">Exploitative Agent Deductions</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-300">Verified</div>
                  <div className="text-emerald-200/80 mt-0.5">Wholesalers & Supermarkets</div>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border border-emerald-100 text-gray-900 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-sm text-emerald-950">Active Produce Listing (Sample)</span>
                  </div>
                  <DemoBadge text="LIVE DEMO PREVIEW" />
                </div>

                <div className="relative rounded-xl overflow-hidden aspect-video mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"
                    alt="Hybrid Tomatoes"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                    Grade A Premium
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    1,500 kg Available
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Hybrid Tomatoes (Sahu-11)</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Madanapalle, Annamayya District
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-emerald-800">₹18.00<span className="text-xs text-gray-500 font-normal"> / kg</span></div>
                      <div className="text-[11px] text-emerald-600 font-medium">Asking Price</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-600">
                      <span>Farmer:</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        Rami Reddy <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Options:</span>
                      <span className="font-medium text-emerald-800">Farmer Delivery & Pickup</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Harvest Date:</span>
                      <span className="font-medium text-gray-800">Yesterday (Fresh Harvest)</span>
                    </div>
                  </div>

                  <Link
                    to="/marketplace"
                    className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>View More Listings in Marketplace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MANDI RATES TICKER */}
      <section className="bg-emerald-800 text-white py-3.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider shrink-0 text-amber-300">
            <TrendingUp className="w-4 h-4" />
            <span>APMC Mandi Bhav (Daily Rates):</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium overflow-x-auto">
            {marketRates.slice(0, 4).map((rate) => (
              <div key={rate.id} className="bg-emerald-900/70 px-3 py-1.5 rounded-lg border border-emerald-700/60 flex items-center gap-2">
                <span className="text-emerald-200">{rate.crop_name}:</span>
                <span className="font-bold text-white">₹{rate.modal_price}/Qtl</span>
                <span className="text-[10px] text-emerald-300">({rate.market_name.split(' ')[0]})</span>
              </div>
            ))}
          </div>

          <Link to="/market-prices" className="text-xs font-bold text-amber-300 hover:text-white underline shrink-0">
            {t('view_all_prices')} →
          </Link>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How RythuDirect Replaces Exploitative Intermediaries
          </h2>
          <p className="text-base text-gray-600 mt-3">
            Designed specifically for farmers and commercial buyers to transact with complete transparency and trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xl mb-5">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('step1_title')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('step1_desc')}</p>
            <div className="p-3 rounded-lg bg-emerald-50 text-[12px] text-emerald-900 font-medium">
              🔒 <span className="font-bold">Private Floor Price:</span> Farmers specify their secret minimum acceptable price. Buyers never see this.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xl mb-5">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('step2_title')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('step2_desc')}</p>
            <div className="p-3 rounded-lg bg-amber-50 text-[12px] text-amber-900 font-medium">
              ⚖️ <span className="font-bold">Partial Orders Allowed:</span> Multiple buyers can purchase fractions of large harvests without overselling.
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xl mb-5">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('step3_title')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('step3_desc')}</p>
            <div className="p-3 rounded-lg bg-emerald-50 text-[12px] text-emerald-900 font-medium">
              📸 <span className="font-bold">Weighment Slips:</span> Net weight = Gross - Tare. Mutually confirmed before final payout release.
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCE */}
      <section className="py-16 bg-emerald-50/50 border-y border-emerald-100/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                Direct From Farm Gates
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Featured Agricultural Harvests
              </h2>
            </div>
            <Link
              to="/marketplace"
              className="text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>Explore All Produce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading verified produce listings...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProduce.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={item.images?.[0]?.image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"}
                      alt={item.crop_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-900/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {item.quality_grade}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                      {item.available_quantity.toLocaleString()} {item.unit} available
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base text-gray-900 leading-snug">
                          {item.crop_name}
                        </h3>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-extrabold text-emerald-800">₹{item.asking_price_per_unit}</span>
                          <span className="text-xs text-gray-500">/{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.village}, {item.district}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Harvest: {new Date(item.harvest_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-gray-400">Farmer:</span>{' '}
                        <span className="font-semibold text-gray-800">{item.farmer?.full_name}</span>
                      </div>
                      <Link
                        to={`/marketplace?id=${item.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition"
                      >
                        Make Offer
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. BENEFITS FOR FARMERS & BUYERS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Farmer Benefits */}
          <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Sprout className="w-3.5 h-3.5" /> For Farmers
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
              Take Full Control of Your Harvest Pricing
            </h3>
            <ul className="space-y-4 text-sm text-emerald-100/90 leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No 8-15% Middleman Cut:</strong> Direct commercial connection preserves farmer margins.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Buyer Offer Comparison:</strong> View offers from hotels, supermarkets, and millers on a single screen.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Zero Unfair Deductions:</strong> All weighments require digital scale slips and joint photo approval.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Prompt Bank Settlements:</strong> Advance payment guarantees before dispatch.</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                to="/register?role=farmer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition"
              >
                Register as a Farmer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Buyer Benefits */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
              <Store className="w-3.5 h-3.5" /> For Commercial Buyers
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
              Sustainably Source High-Quality Produce Directly
            </h3>
            <ul className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Procure at Fair Farm-Gate Rates:</strong> Lower procurement cost by cutting 3 layers of trade intermediaries.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Freshness & Quality Grades:</strong> Grade A & Organic certified harvests straight from harvesting fields.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Traceable Audit Records:</strong> Download standardized weighment records, tax invoices, and receipts.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Flexible Pickup & Delivery:</strong> Choose farm-gate pickup or farmer-coordinated delivery.</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                to="/register?role=buyer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 transition"
              >
                Register as a Buyer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SAMPLE TESTIMONIALS */}
      <section className="py-16 bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {t('testimonials_title')}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Real-world scenarios from our pilot launch</p>
            </div>
            <DemoBadge text={t('sample_content_label')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-7 rounded-2xl bg-emerald-50/50 border border-emerald-100 relative">
              <p className="text-sm text-gray-700 italic leading-relaxed mb-4">
                "{t('testi_1_quote')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm">
                  RR
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t('testi_1_author')}</h4>
                  <p className="text-xs text-emerald-700 font-medium">Progressive Farmer • 18 Years Experience</p>
                </div>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-amber-50/50 border border-amber-100 relative">
              <p className="text-sm text-gray-700 italic leading-relaxed mb-4">
                "{t('testi_2_quote')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-sm">
                  AV
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t('testi_2_author')}</h4>
                  <p className="text-xs text-amber-800 font-medium">Head of Procurement • Hospitality Chain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
