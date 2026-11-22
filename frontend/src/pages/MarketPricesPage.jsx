import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import DemoBadge from '../components/DemoBadge';
import {
  TrendingUp,
  Search,
  MapPin,
  Calendar,
  Building2,
  ArrowUpDown,
  Filter,
  BarChart3
} from 'lucide-react';

export default function MarketPricesPage() {
  const { t, lang } = useLanguage();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cropSearch, setCropSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  
  // Crop comparison tool state
  const [compareCrop, setCompareCrop] = useState('Tomatoes');
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, [cropSearch, districtFilter]);

  useEffect(() => {
    if (compareCrop) {
      loadComparison(compareCrop);
    }
  }, [compareCrop]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cropSearch) params.append('crop_name', cropSearch);
      if (districtFilter) params.append('district', districtFilter);
      const res = await client.get(`/market-prices/?${params.toString()}`);
      setPrices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (crop) => {
    setCompareLoading(true);
    try {
      const res = await client.get(`/market-prices/compare?crop_name=${encodeURIComponent(crop)}`);
      setCompareData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Agmarknet / APMC Market Yard Intelligence</span>
            <DemoBadge text="APMC MANDI BULLETIN" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('market_prices')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Transparent daily market prices from Andhra Pradesh and Telangana APMC market committees to help farmers benchmark asking prices.
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 max-w-xs">
          📌 <strong>Market Truth Note:</strong> Modal price represents the most frequent trading price at the wholesale mandi yard auction.
        </div>
      </div>

      {/* CROP COMPARISON TOOL */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Inter-Mandi Price Comparison Tool</h3>
              <p className="text-xs text-gray-500">Compare wholesale rates across regional markets to decide where to sell</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Select Crop:</span>
            {['Tomatoes', 'Onions', 'Sona Masoori Paddy', 'Red Chillies (Dry)', 'Turmeric Fingers'].map((c) => (
              <button
                key={c}
                onClick={() => setCompareCrop(c)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  compareCrop === c
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {compareLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading cross-market spread...</div>
        ) : compareData && compareData.summary ? (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-[11px] text-gray-500 font-semibold uppercase">Average Modal Rate</div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">₹{compareData.summary.average_modal_price}</div>
                <div className="text-[10px] text-gray-400">per Quintal</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-semibold uppercase">Highest Rate</div>
                <div className="text-xl font-extrabold text-emerald-800 mt-1">₹{compareData.summary.highest_price}</div>
                <div className="text-[10px] text-emerald-600">Premium Mandi</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-[11px] text-amber-700 font-semibold uppercase">Lowest Rate</div>
                <div className="text-xl font-extrabold text-amber-800 mt-1">₹{compareData.summary.lowest_price}</div>
                <div className="text-[10px] text-amber-600">Base Mandi</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <div className="text-[11px] text-purple-700 font-semibold uppercase">Inter-Market Spread</div>
                <div className="text-xl font-extrabold text-purple-800 mt-1">₹{compareData.summary.spread}</div>
                <div className="text-[10px] text-purple-600">Arbitrage Margin</div>
              </div>
            </div>

            {/* Mandi comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {compareData.markets?.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{m.market_name}</h4>
                      <p className="text-[11px] text-gray-500">{m.district}</p>
                    </div>
                    <span className="text-base font-extrabold text-emerald-800">₹{m.modal_price}/Qtl</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-[11px] text-gray-600">
                    <span>Min: ₹{m.min_price}</span>
                    <span>Max: ₹{m.max_price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder="Search crop name (e.g. Tomato, Paddy, Chilli, Onion)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
          >
            <option value="">All Mandi Districts</option>
            <option value="Hyderabad">Hyderabad (Bowenpally / Begum Bazar)</option>
            <option value="Annamayya">Annamayya (Madanapalle)</option>
            <option value="Guntur">Guntur (Mirchi Yard / Duggirala)</option>
            <option value="Nalgonda">Nalgonda (Miryalaguda)</option>
            <option value="West Godavari">West Godavari (Tadepalligudem)</option>
            <option value="Nizamabad">Nizamabad</option>
            <option value="Vikarabad">Vikarabad (Tandur)</option>
            <option value="Warangal">Warangal</option>
          </select>
        </div>
      </div>

      {/* Table of Market Prices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Crop Name</th>
                <th className="py-3.5 px-4">Variety</th>
                <th className="py-3.5 px-4">Market Yard (Mandi)</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4 text-right">Min Price</th>
                <th className="py-3.5 px-4 text-right">Max Price</th>
                <th className="py-3.5 px-4 text-right">Modal (Trading) Price</th>
                <th className="py-3.5 px-4 text-center">Observation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    Loading daily mandi records...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No mandi rates match your filter criteria.
                  </td>
                </tr>
              ) : (
                prices.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/50 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">{p.crop_name}</td>
                    <td className="py-3 px-4 text-gray-600">{p.variety}</td>
                    <td className="py-3 px-4 font-medium text-emerald-950 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{p.market_name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.district}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">₹{p.min_price}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">₹{p.max_price}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 text-sm">
                      ₹{p.modal_price}
                      <span className="text-[10px] text-gray-500 font-normal"> / {p.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 font-medium">
                      {new Date(p.observation_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Source: Official APMC Daily Mandi Yard Bulletins & Agmarknet Feeds</span>
          <DemoBadge text="APMC DATASET" />
        </div>
      </div>
    </div>
  );
}
