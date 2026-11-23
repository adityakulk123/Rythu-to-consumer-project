import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, MapPin, Home, Briefcase, Building } from 'lucide-react';

const AddressModal = ({ isOpen, onClose }) => {
  const { deliveryAddress, setDeliveryAddress } = useCart();

  const [formData, setFormData] = useState({
    type: deliveryAddress?.type || 'Home',
    houseNo: deliveryAddress?.houseNo || '',
    area: deliveryAddress?.area || '',
    city: deliveryAddress?.city || 'Hyderabad',
    pincode: deliveryAddress?.pincode || '',
    landmark: deliveryAddress?.landmark || '',
    contactName: deliveryAddress?.contactName || '',
    contactPhone: deliveryAddress?.contactPhone || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setDeliveryAddress(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Enter Delivery Address</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-700 text-emerald-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          {/* Address Tag Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Save As</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Home', icon: Home, label: 'Home' },
                { id: 'Work', icon: Briefcase, label: 'Work' },
                { id: 'Other', icon: Building, label: 'Other' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = formData.type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: item.id })}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Flat / House No. / Building</label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 402, Green Acres Apartment"
              value={formData.houseNo}
              onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Area / Colony / Street</label>
            <input
              type="text"
              required
              placeholder="e.g. Road No. 12, Banjara Hills"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 font-bold mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">PIN Code</label>
              <input
                type="text"
                required
                placeholder="500034"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nearby Landmark (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Near KBR National Park Main Gate"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Receiver Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Aditya K."
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Receiver Mobile</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9848012345"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-emerald-600 text-slate-800 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
          >
            Save Address & Deliver Here
          </button>

        </form>

      </div>
    </div>
  );
};

export default AddressModal;
