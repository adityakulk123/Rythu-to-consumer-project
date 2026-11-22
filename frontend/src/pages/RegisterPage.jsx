import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Sprout,
  Store,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function RegisterPage() {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(() => searchParams.get('role') || 'farmer');
  
  // Common fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');

  // Farmer specific
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [cropsCultivated, setCropsCultivated] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [organicCertified, setOrganicCertified] = useState(false);

  // Buyer specific
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Wholesaler');
  const [businessAddress, setBusinessAddress] = useState('');
  const [buyerCategory, setBuyerCategory] = useState('Bulk Trader');
  const [gstinPan, setGstinPan] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);

    try {
      let endpoint = role === 'farmer' ? '/auth/register/farmer' : '/auth/register/buyer';
      let payload = {
        full_name: fullName,
        mobile_number: mobileNumber,
        email: email || null,
        password: password,
        village: village,
        district: district,
        state: state,
        pincode: pincode,
      };

      if (role === 'farmer') {
        payload = {
          ...payload,
          farm_name: farmName || `${fullName}'s Farm`,
          farm_location: farmLocation || village,
          crops_cultivated: cropsCultivated || "Mixed Crops",
          farm_size_acres: farmSizeAcres ? parseFloat(farmSizeAcres) : null,
          experience_years: experienceYears ? parseInt(experienceYears) : null,
          organic_certified: organicCertified,
        };
      } else {
        payload = {
          ...payload,
          business_name: businessName || `${fullName} Enterprise`,
          business_type: businessType,
          business_address: businessAddress || `${village}, ${district}`,
          buyer_category: buyerCategory,
          gstin_pan: gstinPan || null,
        };
      }

      const res = await client.post(endpoint, payload);
      const { access_token, role: userRole, user_id, full_name, mobile_number: mob } = res.data;
      loginUser(access_token, { id: user_id, role: userRole, full_name, mobile_number: mob });

      if (userRole === 'farmer') {
        navigate('/farmer');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please verify all fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAF6]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800 text-white shadow-md mb-2">
            <Sprout className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create RythuDirect Account
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Join thousands of farmers and verified buyers across Andhra Pradesh and Telangana
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('farmer')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              role === 'farmer'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>I Am a Farmer (రైతు)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              role === 'buyer'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>I Am a Commercial Buyer (కొనుగోలుదారు)</span>
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm">
          {error && (
            <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100 pb-2">
              1. Basic & Contact Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rami Reddy"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramireddy@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password (Min 6 Chars) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100 pb-2 pt-2">
              2. Location Details
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Village / Town *</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Madanapalle"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Annamayya"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="517325"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Role Specific Section */}
            {role === 'farmer' ? (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                  3. Farm & Cultivation Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Farm Name *</label>
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Reddy Organic Farms"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Farm Location / Landmark *</label>
                    <input
                      type="text"
                      required
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Survey 42/B, Bypass Road"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Major Crops Cultivated *</label>
                    <input
                      type="text"
                      required
                      value={cropsCultivated}
                      onChange={(e) => setCropsCultivated(e.target.value)}
                      placeholder="e.g. Tomatoes, Mangoes, Paddy, Chillies"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Farm Size (Acres)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={farmSizeAcres}
                      onChange={(e) => setFarmSizeAcres(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="organic"
                    checked={organicCertified}
                    onChange={(e) => setOrganicCertified(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <label htmlFor="organic" className="text-xs font-medium text-gray-700 cursor-pointer">
                    Certified Organic Cultivation (NPOP / PGS-India)
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                  3. Business & Commercial Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Business / Firm Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Agarwal Wholesale Mandi Traders"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Business Type *</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      <option value="Wholesaler">Wholesaler / Mandi Trader</option>
                      <option value="Supermarket">Supermarket / Retail Chain</option>
                      <option value="Hotel/Restaurant">Hotel / Restaurant / Hospitality</option>
                      <option value="Food Processor">Food Processing Unit</option>
                      <option value="Retailer">Independent Retailer</option>
                      <option value="Individual Consumer">Bulk Consumer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN or Business PAN</label>
                    <input
                      type="text"
                      value={gstinPan}
                      onChange={(e) => setGstinPan(e.target.value)}
                      placeholder="e.g. 36AABCA1234F1Z5"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Buyer Category *</label>
                    <select
                      value={buyerCategory}
                      onChange={(e) => setBuyerCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      <option value="Bulk Trader">Bulk Trader (Grain/Vegetable)</option>
                      <option value="Retail Outlet">Retail Outlet</option>
                      <option value="Hospitality">Hospitality & Catering</option>
                      <option value="Processing">Agro Processing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Business Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Full street address, godown or shop number..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm mt-4 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Creating Account..." : `Complete ${role === 'farmer' ? 'Farmer' : 'Buyer'} Registration`}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
            Already registered on RythuDirect?{' '}
            <Link to="/login" className="font-bold text-emerald-800 hover:text-emerald-950">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
