import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, UserCheck, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('FARMER'); // FARMER or BUYER ONLY
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Warangal');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');

  // Farmer specific details
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [cultivatedCrops, setCultivatedCrops] = useState('');
  const [farmSize, setFarmSize] = useState('');

  // Buyer specific details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Wholesaler');
  const [businessAddress, setBusinessAddress] = useState('');
  const [buyerCategory, setBuyerCategory] = useState('B2B');
  const [documentType, setDocumentType] = useState('GSTIN');
  const [documentNumber, setDocumentNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      full_name: fullName,
      mobile_number: mobileNumber,
      email: email || null,
      password: password,
      role: role,
      village: village,
      district: district,
      state: state,
      pincode: pincode,
      farmer_details: role === 'FARMER' ? {
        farm_name: farmName,
        farm_location: farmLocation,
        cultivated_crops: cultivatedCrops,
        farm_size_acres: farmSize ? parseFloat(farmSize) : null
      } : null,
      buyer_details: role === 'BUYER' ? {
        business_name: businessName,
        business_type: businessType,
        business_address: businessAddress,
        buyer_category: buyerCategory,
        document_type: documentType,
        document_number: documentNumber
      } : null
    };

    try {
      await register(payload);
      if (role === 'FARMER') navigate('/farmer/dashboard');
      else navigate('/buyer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/80 p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center mx-auto shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Create RythuDirect Account</h2>
          <p className="text-xs text-gray-500">Fair agricultural transactions for farmers & verified buyers</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              role === 'FARMER'
                ? 'bg-[#1B4332] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>I am a Farmer (రైతు)</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('BUYER')}
            className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              role === 'BUYER'
                ? 'bg-[#1B4332] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>I am a Buyer / Wholesaler</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Basic User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Reddy"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Village / Town *</label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Kotapally"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">District *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Warangal"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              >
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="500001"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Role Specific Fields */}
          {role === 'FARMER' ? (
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                Farmer & Land Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Farm Name</label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Reddy Organic Farm"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g. 6.5"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Types of Crops Cultivated</label>
                <input
                  type="text"
                  value={cultivatedCrops}
                  onChange={(e) => setCultivatedCrops(e.target.value)}
                  placeholder="e.g. Paddy, Red Chilli, Cotton, Tomatoes"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
              <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                Buyer Business Verification Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Deccan Agro Traders Pvt Ltd"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Supermarket">Supermarket Chain</option>
                    <option value="Food Processing Co">Food Processing Company</option>
                    <option value="Restaurant">Hotel / Restaurant (HoReCa)</option>
                    <option value="Consumer">Individual Bulk Consumer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Verification Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="GSTIN">GSTIN Certificate</option>
                    <option value="APMC Trader License">APMC Trader License</option>
                    <option value="FSSAI">FSSAI License</option>
                    <option value="Trade License">Municipal Trade License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Document Number</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. 36AABCS1429Z1Z5"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Business Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Market Yard Road / Commercial Complex"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1B4332] hover:bg-emerald-800 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? "Registering..." : `Register as ${role === 'FARMER' ? 'Farmer' : 'Buyer'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Already registered on RythuDirect?{" "}
          <Link to="/login" className="font-extrabold text-emerald-700 hover:underline">
            Login to Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
