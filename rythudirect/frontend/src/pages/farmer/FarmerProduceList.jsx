import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, Edit3, Pause, Play, Trash2, MapPin, AlertCircle, Eye } from 'lucide-react';

const FarmerProduceList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMyProduce();
  }, []);

  const loadMyProduce = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farmer/produce?page_size=50');
      setListings(res.data.items || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load produce listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.put(`/farmer/produce/${item.id}`, { status: nextStatus });
      loadMyProduce();
    } catch (e) {
      alert("Failed to toggle listing status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this produce listing?")) return;
    try {
      await api.delete(`/farmer/produce/${id}`);
      loadMyProduce();
    } catch (e) {
      alert("Failed to delete produce listing.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Manage Produce Listings</h2>
          <p className="text-xs text-gray-500">Track, pause, or edit your farm produce inventory</p>
        </div>
        <Link
          to="/farmer/produce/add"
          className="px-4 py-2.5 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Produce</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading your listings...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <p className="text-gray-500 text-sm">You haven't added any produce listings yet.</p>
          <Link
            to="/farmer/produce/add"
            className="inline-block px-5 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl"
          >
            Publish Your First Crop
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1B4332] text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">Produce</th>
                  <th className="px-5 py-3.5">Total Qty</th>
                  <th className="px-5 py-3.5">Stock Left</th>
                  <th className="px-5 py-3.5">Asking Price</th>
                  <th className="px-5 py-3.5 bg-emerald-950">Private Reserve Min</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900">
                      <div>{item.crop_name}</div>
                      <span className="text-[10px] text-gray-400 font-normal">{item.quality_grade} • {item.village}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="px-5 py-4 font-black text-gray-900">{item.remaining_quantity} {item.unit}</td>
                    <td className="px-5 py-4 font-black text-emerald-800">₹{item.expected_price_per_kg}/kg</td>
                    <td className="px-5 py-4 font-mono font-bold text-amber-800 bg-amber-50/40">
                      ₹{item.min_acceptable_price}/kg
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'PARTIALLY_SOLD'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'SOLD_OUT'
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title={item.status === 'ACTIVE' ? "Pause listing" : "Resume listing"}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        {item.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete listing"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default FarmerProduceList;
