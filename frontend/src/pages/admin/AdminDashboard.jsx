import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DemoBadge from '../../components/DemoBadge';
import {
  ShieldCheck,
  Users,
  Store,
  FileCheck,
  AlertTriangle,
  Layers,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'verifications', 'users', 'disputes'
  const [metrics, setMetrics] = useState({
    total_farmers: 0,
    total_buyers: 0,
    verified_buyers: 0,
    pending_verifications: 0,
    active_listings: 0,
    total_orders: 0,
    total_transaction_value: 0,
    pending_disputes: 0,
  });

  const [pendingBuyers, setPendingBuyers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Dispute resolution modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadAdminData = async () => {
    try {
      const [dashRes, buyersRes, usersRes, disputesRes] = await Promise.all([
        client.get('/admin/dashboard'),
        client.get('/admin/buyers/pending-verifications'),
        client.get('/admin/users'),
        client.get('/admin/disputes')
      ]);

      setMetrics(dashRes.data.metrics);
      setRecentOrders(dashRes.data.recent_orders || []);
      setPendingBuyers(buyersRes.data);
      setAllUsers(usersRes.data);
      setDisputes(disputesRes.data);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Buyer verification actions
  const handleVerifyBuyer = async (buyerId, action) => {
    const notes = prompt(`Enter administrative review notes for this ${action}:`, 
      action === 'approve' ? "GST Certificate and Trade License verified" : "Incomplete business tax documentation");
    if (notes === null) return;

    try {
      await client.post(`/admin/buyers/${buyerId}/verify?action=${action}&notes=${encodeURIComponent(notes)}`);
      setStatusMsg(`Buyer verification ${action}d successfully`);
      loadAdminData();
    } catch (err) {
      alert("Failed to update buyer verification");
    }
  };

  // User suspend / activate
  const handleToggleUser = async (userId) => {
    try {
      const res = await client.patch(`/admin/users/${userId}/toggle-status`);
      setStatusMsg(res.data.message);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user status");
    }
  };

  // Dispute resolution
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    try {
      await client.post(`/admin/disputes/${selectedDispute.id}/resolve`, {
        status: "resolved",
        resolution_notes: resolutionNotes
      });
      setSelectedDispute(null);
      setResolutionNotes('');
      setStatusMsg("Dispute formally resolved and audit log generated");
      loadAdminData();
    } catch (err) {
      alert("Failed to resolve dispute");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{t('admin_dashboard')}</span>
            <DemoBadge text="SUPER ADMIN" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Marketplace Control & Governance
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Logged in as {user?.full_name} • Anti-Middleman Verification & Dispute Mediation System
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-800 text-xs text-emerald-200">
            System Status: <strong>Operational (100%)</strong>
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between">
          <span>✓ {statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('total_farmers')}</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{metrics.total_farmers}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('verified_buyers')} / Total</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {metrics.verified_buyers} <span className="text-sm font-normal text-gray-400">/ {metrics.total_buyers}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('pending_verifications')}</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendingBuyers.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold">{t('transaction_value')}</div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">₹{metrics.total_transaction_value?.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Layers },
          { id: 'verifications', label: `Buyer Verifications (${pendingBuyers.length})`, icon: FileCheck },
          { id: 'users', label: `User Management (${allUsers.length})`, icon: Users },
          { id: 'disputes', label: `Disputes & Mediation (${disputes.length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders Stream */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>Live Order Stream (AP & Telangana)</span>
            </h3>

            <div className="space-y-3">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-900">{ord.order_number}</span>
                    <p className="text-gray-900 font-bold mt-0.5">{ord.quantity} kg • ₹{ord.agreed_price_per_unit}/kg</p>
                    <span className="text-[11px] text-gray-500">Total: ₹{ord.initial_total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {ord.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Verifications quick view */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-700" />
                <span>Urgent Commercial Buyer Verifications</span>
              </h3>
              <button onClick={() => setActiveTab('verifications')} className="text-xs text-emerald-800 font-bold hover:underline">
                View All →
              </button>
            </div>

            {pendingBuyers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                All buyer accounts are currently vetted. Zero pending.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBuyers.slice(0, 3).map((b) => (
                  <div key={b.profile_id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-gray-900">{b.business_name}</h4>
                      <p className="text-[11px] text-gray-500">{b.full_name} • {b.business_type} • GSTIN: {b.gstin_pan || "Pending"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyBuyer(b.buyer_id, 'approve')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyBuyer(b.buyer_id, 'reject')}
                        className="px-2.5 py-1 rounded-lg border border-red-300 text-red-600 font-bold text-xs hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUYER VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Commercial Buyer Onboarding & Document Review</h3>
              <p className="text-xs text-gray-500">Only verified buyers can enter formal contracts and make binding offers</p>
            </div>
            <DemoBadge text="KYB VERIFICATION" />
          </div>

          {pendingBuyers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No pending buyer verifications at this moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Business / Company Name</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Business Type</th>
                    <th className="py-3 px-4">Tax / GSTIN ID</th>
                    <th className="py-3 px-4">Operating Address</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingBuyers.map((b) => (
                    <tr key={b.profile_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">{b.business_name}</td>
                      <td className="py-3 px-4">
                        {b.full_name}
                        <span className="block text-[11px] text-gray-500">{b.mobile_number}</span>
                      </td>
                      <td className="py-3 px-4">{b.business_type} ({b.buyer_category})</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-900">{b.gstin_pan || "Aadhaar/PAN Pending"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{b.business_address}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleVerifyBuyer(b.buyer_id, 'approve')}
                          className="px-3 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerifyBuyer(b.buyer_id, 'reject')}
                          className="px-3 py-1 rounded-lg border border-red-300 text-red-600 font-bold text-xs hover:bg-red-50"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900">Registered Platform Users Directory</h3>
            <span className="text-xs text-gray-500 font-medium">Total: {allUsers.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Profile Details</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">{u.full_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'farmer' ? 'bg-emerald-100 text-emerald-800' : u.role === 'buyer' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.mobile_number}</td>
                    <td className="py-3 px-4">{u.village}, {u.district}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {u.farmer_profile ? `Farm: ${u.farmer_profile.farm_name}` : u.buyer_profile ? `Business: ${u.buyer_profile.business_name}` : 'Admin'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES MEDIATION */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Dispute Mediation & Scale Audit Chamber</h3>
              <p className="text-xs text-gray-500">Handle quantity mismatches, quality deductions, or payment disputes</p>
            </div>
            <DemoBadge text="MEDIATION AUDIT" />
          </div>

          {disputes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
              No disputes reported. Clean marketplace record!
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-100 text-red-800">
                        {d.dispute_type.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-base text-gray-900 mt-1">{d.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{d.description}</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  {d.resolution_notes && (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-950 border border-emerald-200">
                      <strong>Admin Resolution:</strong> {d.resolution_notes}
                    </div>
                  )}

                  {d.status !== 'resolved' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setResolutionNotes("Reviewed joint platform scale certificate and mutually adjusted deduction margin.");
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESOLVE DISPUTE MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">Resolve Dispute #{selectedDispute.id}</h3>
              <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Administrative Resolution Finding *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Issue Formal Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
