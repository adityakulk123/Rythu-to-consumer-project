import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, ArrowRight, ArrowUpDown, Tag, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ExploreProducePage = () => {
  const { t } = useLanguage();
  const [produceList, setProduceList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cropName, setCropName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [sortBy, setSortBy] = useState('recently_listed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProduce();
  }, [selectedCategory, qualityGrade, sortBy, page]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProduce = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cropName) params.append('crop_name', cropName);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (district) params.append('district', district);
      if (qualityGrade) params.append('quality_grade', qualityGrade);
      params.append('sort_by', sortBy);
      params.append('page', page.toString());
      params.append('page_size', '12');

      const res = await api.get(`/buyer/produce?${params.toString()}`);
      setProduceList(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProduce();
  };

  const handleClearFilters = () => {
    setCropName('');
    setSelectedCategory('');
    setDistrict('');
    setQualityGrade('');
    setSortBy('recently_listed');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          Explore Farm Produce
        </h1>
        <p className="text-xs text-gray-500">
          Discover active harvest lots directly from certified farmers across Telangana & Andhra Pradesh.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-4">
        
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="Search by crop name (e.g. Tomato, Chilli, Cotton)..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="District / Village (e.g. Guntur, Nizamabad)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="recently_listed">Recently Listed</option>
              <option value="lowest_price">Price: Low to High</option>
              <option value="highest_price">Price: High to Low</option>
              <option value="highest_quantity">Highest Available Quantity</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
            >
              Reset
            </button>
          </div>

        </form>

        {/* Secondary Category and Grade Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2">Category:</span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedCategory === ''
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Crops
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id.toString())}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === c.id.toString()
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}

          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-4 mr-2">Grade:</span>
          {['Grade A', 'Grade B', 'Grade C'].map((g) => (
            <button
              key={g}
              onClick={() => setQualityGrade(qualityGrade === g ? '' : g)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                qualityGrade === g
                  ? 'bg-amber-400 text-emerald-950 font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Found <strong>{totalCount}</strong> active produce listings</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Produce Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-gray-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : produceList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <p className="text-gray-500 text-sm">No produce listings found matching your criteria.</p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produceList.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-200/80 transition-all flex flex-col group"
            >
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                <img
                  src={p.images?.[0]?.image_url || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600"}
                  alt={p.crop_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 bg-[#1B4332]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {p.quality_grade}
                </div>
                <div className="absolute top-2.5 right-2.5 bg-white/95 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {p.category_name}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {p.crop_name}
                  </h3>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{p.village}, {p.farmer?.district}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/60 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-semibold">Available</span>
                    <p className="font-black text-gray-900 text-xs">{p.remaining_quantity} {p.unit}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-semibold">Asking Price</span>
                    <p className="font-black text-emerald-800 text-xs">₹{p.expected_price_per_kg}/kg</p>
                  </div>
                </div>

                <Link
                  to={`/produce/${p.id}`}
                  className="w-full text-center py-2 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-600 font-semibold px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default ExploreProducePage;
