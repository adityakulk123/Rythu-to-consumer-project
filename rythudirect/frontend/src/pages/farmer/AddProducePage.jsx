import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, Lock, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AddProducePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [cropName, setCropName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [minAcceptablePrice, setMinAcceptablePrice] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [description, setDescription] = useState('');
  const [village, setVillage] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
      if (res.data.length > 0) setCategoryId(res.data[0].id.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const askPrice = parseFloat(expectedPrice);
    const minPrice = parseFloat(minAcceptablePrice);

    if (minPrice > askPrice) {
      setError("Your confidential minimum acceptable price cannot be higher than your asking price.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/farmer/produce', {
        crop_name: cropName,
        category_id: parseInt(categoryId),
        quantity: parseFloat(quantity),
        unit: unit,
        expected_price_per_kg: askPrice,
        min_acceptable_price: minPrice,
        harvest_date: harvestDate,
        available_until: availableUntil,
        quality_grade: qualityGrade,
        description: description,
        village: village || null,
        delivery_location: deliveryLocation || null,
        delivery_available: deliveryAvailable,
        pickup_available: pickupAvailable,
        image_urls: imageUrl ? [imageUrl] : [],
      });
      navigate('/farmer/produce');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add produce listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900">Add New Agricultural Produce</h2>
        <p className="text-xs text-gray-500">List your harvest with guaranteed private floor reserve protection</p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Crop Name *</label>
            <input
              type="text"
              required
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Guntur Teja Chilli / Hybrid Tomato"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Crop Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Available Quantity *</label>
            <input
              type="number"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
            >
              <option value="KG">Kilograms (KG)</option>
              <option value="TONNES">Tonnes</option>
              <option value="QUINTALS">Quintals</option>
              <option value="BAGS">Bags</option>
            </select>
          </div>
        </div>

        {/* PRICE BAR WITH STRICTLY PRIVATE RESERVE */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Public Asking Price (₹/kg) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  placeholder="e.g. 16.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-black text-[#1B4332] bg-white"
                />
              </div>
              <span className="text-[10px] text-gray-500">Displayed openly to all prospective buyers</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Private Minimum Price (₹/kg) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minAcceptablePrice}
                  onChange={(e) => setMinAcceptablePrice(e.target.value)}
                  placeholder="e.g. 13.00"
                  className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-xl text-sm font-black text-amber-900 bg-white"
                />
              </div>
              <span className="text-[10px] text-amber-800 font-semibold">Strictly hidden from buyers; used for negotiation safety</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Harvest Date *</label>
            <input
              type="date"
              required
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Available Until Date *</label>
            <input
              type="date"
              required
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Quality Grade</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium"
            >
              <option value="Grade A">Grade A (Premium / Export)</option>
              <option value="Grade B">Grade B (Standard Market)</option>
              <option value="Grade C">Grade C (Processing)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Village & Farm Gate Location</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Ghanpur, Survey No 42"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Delivery / Weighbridge Hub</label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="e.g. Near Ghanpur APMC Scale"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 pt-1 text-xs font-bold text-gray-700">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pickupAvailable}
              onChange={(e) => setPickupAvailable(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span>Farm Gate Pickup Available</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryAvailable}
              onChange={(e) => setDeliveryAvailable(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span>Direct Field Delivery Available</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Photo URL (Optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Produce Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe harvest method, moisture content, skin firmness, packaging..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/farmer/produce')}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Publishing..." : "Publish Produce Listing"}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default AddProducePage;
