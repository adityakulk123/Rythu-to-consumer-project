import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, MapPin, Calendar, Info, RefreshCw } from 'lucide-react';
import api from '../services/api';

const MarketPricesPage = () => {
  const [prices, setPrices] = useState([]);
  const [cropSearch, setCropSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [selectedCropCompare, setSelectedCropCompare] = useState('Tomato');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
    loadComparison('Tomato');
  }, []);

  const loadPrices = async () => {
    setLoading(true);
    try {
      let url = '/market-prices';
      const params = new URLSearchParams();
      if (cropSearch) params.append('crop_name', cropSearch);
      if (districtFilter) params.append('district', districtFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      setPrices(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async (crop) => {
    setSelectedCropCompare(crop);
    try {
      const res = await api.get(`/market-prices/compare?crop_name=${encodeURIComponent(crop)}`);
      setComparisonData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPrices();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
          <TrendingUp className="w-4 h-4 text-amber-800" />
          <span>Authorized Regional Benchmark Feeds</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          Smart Mandi Market Price Information
        </h1>
        <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
          Official benchmark prices from major Agricultural Produce Market Committees (APMC) and Mandis across Telangana and Andhra Pradesh. All data points are clearly labelled with exact observation date and reporting source.
        </p>
      </div>

      {/* Cross-Market Comparison Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Cross-Market Price Comparison: <span className="text-emerald-800">{selectedCropCompare}</span>
            </h3>
            <p className="text-xs text-gray-500">Discover where this crop is commanding the highest modal rate</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Tomato', 'Red Chilli', 'Paddy (Common)', 'Turmeric', 'Onion', 'Cotton', 'Mango'].map((c) => (
              <button
                key={c}
                onClick={() => loadComparison(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCropCompare === c
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {comparisonData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparisonData.markets.map((m) => (
                <div key={m.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-gray-900">{m.market_name}</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-950 font-bold px-2 py-0.5 rounded-full">{m.district}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Modal Price (Trade Benchmark)</span>
                    <p className="text-xl font-black text-emerald-800">₹{m.modal_price}/kg</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-emerald-100">
                    <span>Min: ₹{m.min_price}</span>
                    <span>Max: ₹{m.max_price}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl">
              <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{comparisonData.data_source_disclaimer}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder="Search crop (e.g. Chilli, Paddy, Turmeric)..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="w-full sm:w-48">
          <input
            type="text"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            placeholder="Filter district..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Mandis</span>
        </button>
      </form>

      {/* Detailed Market Prices Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1B4332] text-white uppercase text-[10px] tracking-wider font-extrabold">
              <tr>
                <th className="px-5 py-3.5">Crop Name</th>
                <th className="px-5 py-3.5">Market / Mandi</th>
                <th className="px-5 py-3.5">District & State</th>
                <th className="px-5 py-3.5 text-right">Min Price</th>
                <th className="px-5 py-3.5 text-right">Max Price</th>
                <th className="px-5 py-3.5 text-right bg-emerald-900">Modal Price</th>
                <th className="px-5 py-3.5">Date of Observation</th>
                <th className="px-5 py-3.5">Feed Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 font-medium">
                    Loading market price observations...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No market prices matching your filter.
                  </td>
                </tr>
              ) : (
                prices.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-extrabold text-gray-900">{p.crop_name}</td>
                    <td className="px-5 py-4 font-bold text-emerald-800">{p.market_name}</td>
                    <td className="px-5 py-4 text-gray-600">{p.district}, {p.state}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-600">₹{p.min_price}/kg</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-600">₹{p.max_price}/kg</td>
                    <td className="px-5 py-4 text-right font-black text-emerald-900 bg-emerald-50/40 text-sm">₹{p.modal_price}/kg</td>
                    <td className="px-5 py-4 text-gray-500 font-mono text-[11px]">{p.observation_date}</td>
                    <td className="px-5 py-4 text-[10px] text-gray-400 max-w-xs truncate" title={p.data_source}>
                      {p.data_source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MarketPricesPage;
