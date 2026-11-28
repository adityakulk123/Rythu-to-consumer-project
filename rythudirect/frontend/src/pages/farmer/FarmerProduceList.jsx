import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, Edit3, Pause, Play, Trash2, MapPin, AlertCircle, CheckCircle, X } from 'lucide-react';

const FarmerProduceList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMyProduce();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
      showToast(`Listing ${nextStatus === 'ACTIVE' ? 'resumed' : 'paused'} successfully.`);
    } catch (e) {
      alert("Failed to toggle listing status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/farmer/produce/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadMyProduce();
      showToast("Produce listing deleted successfully.");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || "Failed to delete produce listing.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1B4332] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 border border-emerald-600">
          <CheckCircle className="w-4 h-4 text-[#E9C46A]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Confirm Deletion</h3>
              <p className="text-xs text-gray-500 font-medium">
                Are you sure you want to delete this produce listing? This action cannot be undone.
              </p>
              <div className="mt-2 p-2.5 bg-gray-50 rounded-xl text-left border border-gray-100">
                <span className="text-xs font-bold text-gray-800 block">{deleteTarget.crop_name}</span>
                <span className="text-[11px] text-gray-500">
                  {deleteTarget.remaining_quantity} {deleteTarget.unit} available &bull; ₹{deleteTarget.expected_price_per_kg}/kg
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
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
                      <span className="text-[10px] text-gray-400 font-normal">{item.quality_grade} &bull; {item.village}</span>
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
                          : item.status === 'ARCHIVED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title={item.status === 'ACTIVE' ? "Pause listing" : "Resume listing"}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {item.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        title="Delete produce listing"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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
