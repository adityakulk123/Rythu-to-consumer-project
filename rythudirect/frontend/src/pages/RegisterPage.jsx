import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Sprout, 
  ShoppingBag, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 3 distinct registration modes: 'CUSTOMER', 'DEALER', 'FARMER'
  const initialType = searchParams.get('type') || searchParams.get('role');
  const [accountType, setAccountType] = useState(
    initialType === 'dealer' ? 'DEALER' :
    initialType === 'farmer' ? 'FARMER' : 'CUSTOMER'
  );

  // Common user fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');

  // Farmer specific details
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [cultivatedCrops, setCultivatedCrops] = useState('');
  const [farmSize, setFarmSize] = useState('');

  // Dealer specific details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Wholesaler');
  const [businessAddress, setBusinessAddress] = useState('');
  const [buyerCategory, setBuyerCategory] = useState('WHOLESALER');
  const [documentType, setDocumentType] = useState('GSTIN');
  const [documentNumber, setDocumentNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const qType = searchParams.get('type') || searchParams.get('role');
    if (qType === 'dealer') setAccountType('DEALER');
    else if (qType === 'farmer') setAccountType('FARMER');
    else if (qType === 'customer') setAccountType('CUSTOMER');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Map UI accountType to backend API schema
    const role = accountType === 'FARMER' ? 'FARMER' : 'BUYER';

    let buyerDetails = null;
    if (accountType === 'CUSTOMER') {
      // Normal retail customer: clean profile without business docs
      buyerDetails = {
        business_name: `${fullName.trim()} (Retail Customer)`,
        business_type: 'Consumer',
        business_address: village ? `${village}, ${district}` : 'Home Address',
        buyer_category: 'INDIVIDUAL_CONSUMER',
        document_type: null,
        document_number: null
      };
    } else if (accountType === 'DEALER') {
      // Wholesale Dealer: requires business credentials
      buyerDetails = {
        business_name: businessName || `${fullName} Traders`,
        business_type: businessType,
        business_address: businessAddress || `${village}, ${district}`,
        buyer_category: buyerCategory,
        document_type: documentType,
        document_number: documentNumber
      };
    }

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
      farmer_details: accountType === 'FARMER' ? {
        farm_name: farmName,
        farm_location: farmLocation || village,
        cultivated_crops: cultivatedCrops,
        farm_size_acres: farmSize ? parseFloat(farmSize) : null
      } : null,
      buyer_details: buyerDetails
    };

    try {
      await register(payload);
      if (accountType === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (accountType === 'DEALER') {
        navigate('/buyer/dashboard');
      } else {
        // Customer goes straight to fresh store
        navigate('/store');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/80 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center mx-auto shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Create Your Account
          </h2>
          <p className="text-xs text-gray-500">
            Select your account type below to get started with RythuDirect
          </p>
        </div>

        {/* 3 Separate Account Type Tabs */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
            Choose Account Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-2xl">
            
            {/* 1. Customer Option */}
            <button
              type="button"
              onClick={() => setAccountType('CUSTOMER')}
              className={`py-3 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                accountType === 'CUSTOMER'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Customer</span>
              <span className={`text-[9px] font-normal hidden sm:inline ${
                accountType === 'CUSTOMER' ? 'text-emerald-200' : 'text-gray-400'
              }`}>
                Fresh Mart
              </span>
            </button>

            {/* 2. Wholesale Dealer Option */}
            <button
              type="button"
              onClick={() => setAccountType('DEALER')}
              className={`py-3 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                accountType === 'DEALER'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Dealer / Trader</span>
              <span className={`text-[9px] font-normal hidden sm:inline ${
                accountType === 'DEALER' ? 'text-amber-200' : 'text-gray-400'
              }`}>
                Wholesale (500kg+)
              </span>
            </button>

            {/* 3. Farmer Option */}
            <button
              type="button"
              onClick={() => setAccountType('FARMER')}
              className={`py-3 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                accountType === 'FARMER'
                  ? 'bg-[#1B4332] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Farmer (రైతు)</span>
              <span className={`text-[9px] font-normal hidden sm:inline ${
                accountType === 'FARMER' ? 'text-emerald-200' : 'text-gray-400'
              }`}>
                Sell Harvest
              </span>
            </button>

          </div>
        </div>

        {/* Informative Banner based on selection */}
        {accountType === 'CUSTOMER' && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Simple & Fast Customer Registration</p>
              <p className="text-[11px] text-emerald-700">No GST or business documentation required. Order fresh vegetables and fruits in 15 mins!</p>
            </div>
          </div>
        )}

        {accountType === 'DEALER' && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-950">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Wholesale Dealer / Commercial Registration</p>
              <p className="text-[11px] text-amber-800">For bulk procurement (500kg - 10 tonnes), mandi traders, supermarkets & restaurants.</p>
            </div>
          </div>
        )}

        {accountType === 'FARMER' && (
          <div className="p-3 rounded-2xl bg-emerald-950/10 border border-emerald-800/30 flex items-center gap-2.5 text-xs text-emerald-950">
            <UserCheck className="w-5 h-5 text-emerald-800 shrink-0" />
            <div>
              <p className="font-bold">రైతుల రిజిస్ట్రేషన్ (Farmer Account)</p>
              <p className="text-[11px] text-emerald-800">పంట వివరాలు నమోదు చేసి నేరుగా పెద్ద కొనుగోలుదారులకు గిట్టుబాటు ధరకు అమ్మండి.</p>
            </div>
          </div>
        )}

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
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                {accountType === 'CUSTOMER' ? 'Area / Colony *' : 'Village / Town *'}
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={accountType === 'CUSTOMER' ? 'e.g. Banjara Hills' : 'e.g. Kotapally'}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">District / City *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
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
                placeholder="500034"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Role Specific Fields: ONLY Shown for Dealer or Farmer */}
          {accountType === 'DEALER' && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-300 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <span>Dealer Business Verification Details</span>
                </h4>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold">
                  B2B Wholesale Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Business / Firm Name *</label>
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
                    onChange={(e) => {
                      setBusinessType(e.target.value);
                      setBuyerCategory(e.target.value.toUpperCase());
                    }}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Retailer">Retail Store Owner</option>
                    <option value="Supermarket">Supermarket Chain (e.g. More, DMart)</option>
                    <option value="Food Processing Co">Food Processing Factory</option>
                    <option value="Restaurant">Hotel / Restaurant (HoReCa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Verification Document Type *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="GSTIN">GSTIN Certificate</option>
                    <option value="APMC Trader License">APMC Mandi Trader License</option>
                    <option value="FSSAI">FSSAI License</option>
                    <option value="Trade License">Municipal Trade License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Document / GST Number *</label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. 36AABCS1429Z1Z5"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Commercial Business Address</label>
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

          {accountType === 'FARMER' && (
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Farmer Land & Crop Details</span>
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
                    placeholder="e.g. 5.0"
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
                  placeholder="e.g. Tomatoes, Red Chillies, Cotton, Paddy"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              accountType === 'CUSTOMER'
                ? 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-800/20'
                : accountType === 'DEALER'
                ? 'bg-amber-700 hover:bg-amber-800 shadow-amber-700/20'
                : 'bg-[#1B4332] hover:bg-emerald-950 shadow-emerald-900/20'
            }`}
          >
            <span>
              {loading
                ? "Creating Account..."
                : accountType === 'CUSTOMER'
                ? "Register as Customer & Start Shopping 🛒"
                : accountType === 'DEALER'
                ? "Register as Wholesale Dealer 🏢"
                : "Register as Farmer (రైతుగా నమోదు) 👨‍🌾"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100">
          Already registered on RythuDirect?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            Login to Account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
