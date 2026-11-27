import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PRODUCE_CATEGORIES, FRESH_PRODUCTS } from '../services/produceCatalog';
import api from '../services/api';
import { 
  Search, 
  Clock, 
  MapPin, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Star
} from 'lucide-react';

const CustomerStorePage = ({ onOpenAddressModal }) => {
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    getItemQuantity, 
    totalItemsCount, 
    subtotal, 
    setIsCartOpen,
    deliveryAddress 
  } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [backendProducts, setBackendProducts] = useState([]);

  useEffect(() => {
    // Fetch live produce listings from Neon DB
    api.get('/buyer/produce?page_size=50')
      .then(res => {
        const items = res.data?.items || res.data || [];
        const mapped = items.map(p => ({
          id: `db-crop-${p.id}`,
          name: p.crop_name,
          category: (p.crop_name || '').toLowerCase().includes('kiwi') || (p.category_name || '').toLowerCase().includes('fruit') ? 'fruits' :
                    (p.category_name || '').toLowerCase().includes('grain') ? 'grains' :
                    (p.category_name || '').toLowerCase().includes('pulse') ? 'pulses' : 'vegetables',
          unit: `${p.quantity || 1} ${p.unit || 'kg'} pack`,
          price: Math.round(Number(p.expected_price_per_kg) || 40),
          originalPrice: Math.round((Number(p.expected_price_per_kg) || 40) * 1.35),
          discount: '25% OFF',
          rating: 4.9,
          ratingCount: 38,
          image: p.images && p.images.length > 0 ? p.images[0].image_url : (p.image_urls && p.image_urls[0]) || ((p.crop_name || '').toLowerCase().includes('kiwi') ? '/produce/kiwi.jpg' : '/produce/kiwi.jpg'),
          farmer: p.farmer_name || 'Direct Farm Producer',
          origin: p.delivery_location || p.village || 'Telangana Direct Hub',
          harvestedTime: 'Direct Farm Harvest',
          deliveryTime: '15-20 Mins',
          description: p.description || `${p.crop_name} fresh from farm harvest.`,
          inStock: true
        }));
        setBackendProducts(mapped);
      })
      .catch(err => {
        console.warn("Could not fetch backend produce:", err);
      });
  }, []);

  // Also read any custom items saved in localStorage
  const localProducts = useMemo(() => {
    try {
      const saved = localStorage.getItem('rythu_custom_produce');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Combined Catalog: localStorage custom produce + backend DB listings + FRESH_PRODUCTS
  const combinedCatalog = useMemo(() => {
    const all = [...localProducts, ...backendProducts, ...FRESH_PRODUCTS];
    const seen = new Set();
    return all.filter(item => {
      const key = (item.name || '').toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localProducts, backendProducts]);

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    return combinedCatalog.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.origin.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.ratingCount - a.ratingCount; // popular
    });
  }, [combinedCatalog, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      
      {/* Top Blinkit/Instamart Delivery Strip */}
      <div className="bg-emerald-800 text-white shadow-md sticky top-18 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Delivery Location & Speed */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0 shadow-inner">
              <Clock className="w-5 h-5 text-emerald-200 animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#E9C46A] flex items-center gap-1">
                  ⚡ 15-20 Mins Delivery
                </span>
                <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded-full text-emerald-200">
                  Farm Fresh Hub
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#E9C46A] shrink-0" />
                <span className="font-semibold text-white truncate">
                  {deliveryAddress ? `${deliveryAddress.houseNo ? deliveryAddress.houseNo + ', ' : ''}${deliveryAddress.area || deliveryAddress.city}` : 'Select Delivery Address'}
                </span>
                <button 
                  onClick={onOpenAddressModal}
                  className="text-xs text-[#E9C46A] underline font-bold hover:text-white shrink-0 ml-1"
                >
                  {deliveryAddress ? 'Change' : '+ Add Address'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Wholesale Dealer Switcher Banner */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              to="/explore"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-xs font-bold text-emerald-200 flex items-center gap-1.5 transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Are you a Dealer? Wholesale Mandi (500kg+)</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>

        </div>

        {/* Live Search Bar & Quick Suggestion Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search 'Jowar', 'Sona Masoori Rice', 'Kusumalu', 'Fresh Tomatoes', 'Palak', 'Lady Finger'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-20 py-2.5 rounded-2xl bg-white text-slate-800 placeholder-slate-400 text-sm shadow-md outline-none focus:ring-2 focus:ring-[#E9C46A] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-[11px] text-emerald-100 no-scrollbar">
            <span className="text-emerald-300 font-bold shrink-0">Popular:</span>
            {['Jowar (జొన్నలు)', 'Sona Masoori Rice', 'Kusumalu Seeds', 'Tomatoes', 'Toor Dal', 'Groundnut Oil', 'Lady Finger'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag.split(' ')[0])}
                className="bg-emerald-700/60 hover:bg-emerald-700 px-2.5 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer border border-emerald-600/40 text-white font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

        {/* Hero Promotional Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-[11px] font-bold text-[#E9C46A] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Direct From Telangana & AP Farms
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Eat Healthy. Pay Less.<br />
              <span className="text-[#E9C46A]">Zero Middleman Markup.</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-md">
              Freshly harvested vegetables and orchard fruits delivered to your kitchen in 15-20 minutes. Up to 40% cheaper than retail supermarkets!
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-600/40">
                🌿 No Chemical Carbide
              </span>
              <span className="bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-600/40">
                ⚖️ 100% Certified Weighing
              </span>
              <span className="bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-600/40">
                🚚 Free Delivery above ₹199
              </span>
            </div>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute -right-10 -bottom-10 opacity-20 text-9xl select-none pointer-events-none">
            🥦
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {PRODUCE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all' 
              ? FRESH_PRODUCTS.length 
              : FRESH_PRODUCTS.filter(p => p.category === cat.id).length;
            const emoji = 
              cat.id === 'all' ? '✨' :
              cat.id === 'vegetables' ? '🥕' :
              cat.id === 'fruits' ? '🍎' :
              cat.id === 'leafy' ? '🥬' :
              cat.id === 'grains' ? '🌾' :
              cat.id === 'pulses' ? '🫘' :
              cat.id === 'oils' ? '🫒' : '📦';

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/30 scale-105 ring-2 ring-emerald-500'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="text-sm">{emoji}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                  ({cat.telugu})
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  isSelected ? 'bg-emerald-700 text-[#E9C46A]' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Header & Sorting */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{PRODUCE_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Fresh Produce'}</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredProducts.length} items available)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((product) => {
            const qty = getItemQuantity(product.id);

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 mb-3">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Discount Badge */}
                    {product.discount && (
                      <span className="absolute top-2 left-2 bg-emerald-700 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                        {product.discount}
                      </span>
                    )}

                    {/* Freshness Badge */}
                    <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white font-semibold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{product.harvestedTime}</span>
                    </span>
                  </div>

                  {/* Delivery ETA & Origin */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      ⚡ {product.deliveryTime}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {product.rating}
                    </span>
                  </div>

                  {/* Title & Unit */}
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {product.unit}
                  </p>

                  {/* Farm Origin */}
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    🌱 {product.farmer} • {product.origin}
                  </p>
                </div>

                {/* Price and Add/Quantity Action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-sm sm:text-base text-slate-900">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Blinkit Style ADD / Stepper Button */}
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-extrabold text-xs transition-colors shadow-xs active:scale-95"
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center bg-emerald-700 text-white rounded-xl overflow-hidden shadow-xs">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="px-2.5 py-1.5 hover:bg-emerald-800 transition active:scale-95"
                        title="Remove"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-black font-mono">
                        {qty}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-2.5 py-1.5 hover:bg-emerald-800 transition active:scale-95"
                        title="Add"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm">No produce found matching "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-3 text-xs font-bold text-emerald-700 underline"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Floating Bottom Cart Pill (Blinkit Style) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="cursor-pointer bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-emerald-700/60 transition-transform hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center font-bold text-white shadow-inner">
                <ShoppingBag className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-200 block uppercase">
                  {totalItemsCount} {totalItemsCount === 1 ? 'ITEM' : 'ITEMS'} IN BASKET
                </span>
                <span className="font-black text-base">
                  ₹{subtotal}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-sm bg-emerald-700 px-4 py-2 rounded-xl text-[#E9C46A]">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerStorePage;
