import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  ShieldCheck, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Layers, 
  FileText,
  UserX,
  Search,
  Activity,
  Eye,
  MousePointer,
  ShieldAlert,
  Clock,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, disputes, activity
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [disputeNotes, setDisputeNotes] = useState({});
  const [activitySummary, setActivitySummary] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [roleFilter]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityData();
    }
  }, [activeTab]);

  const loadActivityData = async () => {
    setActivityLoading(true);
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.get('/activity/summary'),
        api.get('/activity/logs?limit=40')
      ]);
      setActivitySummary(sumRes.data);
      setActivityLogs(logsRes.data);
    } catch (e) {
      console.error("Failed to load activity logs:", e);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, dispRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get(roleFilter ? `/admin/users?role=${roleFilter}` : '/admin/users'),
        api.get('/admin/disputes'),
      ]);
      setMetrics(dashRes.data);
      setUsers(usersRes.data);
      setDisputes(dispRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBuyer = async (buyerProfileId, status) => {
    try {
      await api.post(`/admin/buyers/${buyerProfileId}/verify?status_update=${status}&notes=Verified by Admin audit`);
      loadAdminData();
    } catch (e) {
      alert("Failed to update buyer verification.");
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-status`);
      loadAdminData();
    } catch (e) {
      alert("Failed to toggle user status.");
    }
  };

  const handleResolveDispute = async (disputeId, status) => {
    const notes = disputeNotes[disputeId] || "Resolved after evidence evaluation.";
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, {
        status: status,
        resolution_notes: notes,
      });
      loadAdminData();
    } catch (e) {
      alert("Failed to resolve dispute.");
    }
  };

  if (loading && !metrics) {
    return <div className="py-12 text-center text-xs text-gray-500">Loading admin central metrics...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">
            Platform Governance Console
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-2">RythuDirect Administrator Dashboard</h1>
          <p className="text-xs text-gray-500">Monitor fair marketplace transactions, enforce weighment integrity, and verify buyer credentials</p>
        </div>

        <div className="flex items-center gap-2">
          {['overview', 'users', 'disputes', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'activity' ? 'Activity & Security' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 7 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Total Registered Farmers</span>
          <p className="text-2xl font-black text-[#1B4332]">{metrics?.total_farmers || 0}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Active rural producers</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Verified Buyers</span>
          <p className="text-2xl font-black text-blue-900">{metrics?.total_verified_buyers || 0} <span className="text-xs text-gray-400 font-normal">/ {metrics?.total_buyers}</span></p>
          <span className="text-[10px] text-blue-700 font-semibold">GSTIN/APMC audited</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Total Produce Listings</span>
          <p className="text-2xl font-black text-gray-900">{metrics?.total_produce_listings || 0}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{metrics?.active_produce_listings} currently open</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Gross Transaction Value (GMV)</span>
          <p className="text-2xl font-black text-emerald-800">₹{metrics?.total_transaction_value?.toLocaleString('en-IN') || 0}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Direct farm settlements</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Total Orders</span>
          <p className="text-2xl font-black text-gray-900">{metrics?.total_transactions || 0}</p>
          <span className="text-[10px] text-gray-500 font-semibold">{metrics?.completed_orders} completed</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-gray-500">Pending Buyer Verifications</span>
          <p className="text-2xl font-black text-amber-800">{metrics?.pending_buyer_verifications || 0}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Awaiting document check</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1 col-span-2">
          <span className="text-xs font-bold text-gray-500">Open Reported Disputes</span>
          <p className="text-2xl font-black text-red-700">{metrics?.pending_disputes || 0}</p>
          <span className="text-[10px] text-red-600 font-semibold">Requires administrative arbitration</span>
        </div>

      </div>

      {/* TAB 1: OVERVIEW / BUYER VERIFICATION */}
      {(activeTab === 'overview' || activeTab === 'verification') && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Buyer Business Verification Requests</h3>
              <p className="text-xs text-gray-500">Approve or reject APMC trader licences and GSTIN documentation</p>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Audit Gate
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {users.filter(u => u.role === 'BUYER').map((b) => {
              const prof = b.buyer_profile;
              const isVerified = prof?.is_verified;
              const latestVerif = prof?.verifications?.[0];

              return (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900">{prof?.business_name || b.full_name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isVerified ? "VERIFIED" : "PENDING AUDIT"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Contact: <strong>{b.full_name}</strong> • Mobile: {b.mobile_number} • District: {b.district}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Type: <strong>{prof?.business_type}</strong> • Doc: {latestVerif?.document_type || "GSTIN"} ({latestVerif?.document_number || "36AABCS1001Z1"})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isVerified ? (
                      <button
                        onClick={() => handleVerifyBuyer(prof?.id, 'APPROVED')}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Approve Verification
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyBuyer(prof?.id, 'REJECTED')}
                        className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                      >
                        Revoke Badge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DISPUTES MANAGER */}
      {(activeTab === 'overview' || activeTab === 'disputes') && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Reported Transaction Disputes & Arbitration</h3>
              <p className="text-xs text-gray-500">Investigate scale tare discrepancies, quality deductions, or payment delays</p>
            </div>
            <span className="bg-red-100 text-red-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Legal Metrology & APMC Mediation
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">No reported disputes on the platform.</div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-red-700 uppercase tracking-wide">
                        Issue: {d.reason.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-gray-800 mt-0.5">
                        Order #{d.order_number} • Raised by: <strong>{d.raised_by_name} ({d.raised_by_role})</strong>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      d.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200/60 leading-relaxed">
                    "{d.description}"
                  </p>

                  {d.status === 'OPEN' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Resolution judgment note (e.g. Weighbridge certified tare affirmed)..."
                        value={disputeNotes[d.id] || ''}
                        onChange={(e) => setDisputeNotes({ ...disputeNotes, [d.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveDispute(d.id, 'RESOLVED')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                        >
                          Resolve in Favor
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, 'REJECTED')}
                          className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                        >
                          Dismiss Claim
                        </button>
                      </div>
                    </div>
                  )}

                  {d.resolution_notes && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg font-medium">
                      Admin Resolution: {d.resolution_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & SUSPENSION */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">User Registry & Account Control</h3>
              <p className="text-xs text-gray-500">Monitor active farmers and buyers; suspend fraudulent actors</p>
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="">All Roles</option>
              <option value="FARMER">Farmers</option>
              <option value="BUYER">Buyers</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1B4332] text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Mobile & Email</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-[11px]">{u.mobile_number}</td>
                    <td className="px-4 py-3 text-gray-600">{u.village}, {u.district}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
                            u.is_active
                              ? 'border border-red-200 text-red-700 hover:bg-red-50'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          }`}
                        >
                          {u.is_active ? 'Suspend Account' : 'Reactivate'}
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

      {/* ACTIVITY & SECURITY TRACKING TAB */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Activity & Security Auditing</h2>
              <p className="text-xs text-gray-500">Live monitoring of user navigation, feature usage, and authentication security (Intra-platform only)</p>
            </div>
            <button
              onClick={loadActivityData}
              disabled={activityLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activityLoading ? 'animate-spin' : ''}`} />
              Refresh Activity
            </button>
          </div>

          {/* Activity Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Events</span>
              <span className="text-2xl font-black text-gray-900">{activitySummary?.total_events || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Page Views</span>
              <span className="text-2xl font-black text-blue-600">{activitySummary?.total_page_views || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Feature Clicks</span>
              <span className="text-2xl font-black text-purple-600">{activitySummary?.total_feature_clicks || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Logins</span>
              <span className="text-2xl font-black text-emerald-600">{activitySummary?.successful_logins || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Failed Logins</span>
              <span className={`text-2xl font-black ${(activitySummary?.failed_logins || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {activitySummary?.failed_logins || 0}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active Users</span>
              <span className="text-2xl font-black text-amber-600">{activitySummary?.unique_active_users || 0}</span>
            </div>
          </div>

          {/* Navigation Trends & Failed Logins Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Visited Pages & Features */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                Frequently Visited Pages (Navigation Patterns)
              </h3>
              <div className="space-y-2">
                {activitySummary?.top_pages?.length ? (
                  activitySummary.top_pages.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50">
                      <span className="font-mono text-gray-700 truncate max-w-[280px]">{p.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {p.count} views
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">No page views recorded yet</p>
                )}
              </div>
            </div>

            {/* Security Alerts: Failed Logins */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Security & Failed Login Alerts
              </h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {activitySummary?.recent_suspicious_or_failed_attempts?.length ? (
                  activitySummary.recent_suspicious_or_failed_attempts.map((alert) => (
                    <div key={alert.id} className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs flex items-start justify-between">
                      <div>
                        <span className="font-bold text-red-800 block">Target: {alert.user_identifier || 'Unknown'}</span>
                        <span className="text-[11px] text-red-600">{alert.details || 'Failed credential verification'}</span>
                        <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                          <span>IP: {alert.ip_address || 'unknown'}</span>
                          <span>•</span>
                          <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-red-200 text-red-900 text-[10px] font-black rounded-md uppercase">
                        {alert.activity_type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-70" />
                    No suspicious activities or failed login attempts detected. System secure.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log Feed */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Real-Time User Activity Stream
              </h3>
              <span className="text-xs text-gray-500">Last 40 events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">User / Identifier</th>
                    <th className="px-4 py-3">Page / Feature</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activityLogs.map((log) => {
                    let badgeColor = 'bg-gray-100 text-gray-700';
                    if (log.activity_type === 'PAGE_VIEW') badgeColor = 'bg-blue-100 text-blue-800';
                    else if (log.activity_type === 'LOGIN_SUCCESS') badgeColor = 'bg-emerald-100 text-emerald-800';
                    else if (log.activity_type === 'LOGIN_FAILED') badgeColor = 'bg-red-100 text-red-800';
                    else if (log.activity_type === 'LOGOUT') badgeColor = 'bg-amber-100 text-amber-800';
                    else if (log.activity_type === 'REGISTER') badgeColor = 'bg-purple-100 text-purple-800';
                    else if (log.activity_type === 'FEATURE_INTERACTION') badgeColor = 'bg-teal-100 text-teal-800';

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                            {log.activity_type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-800 font-medium">
                          {log.user_identifier || 'Guest'}
                          {log.user_role && (
                            <span className="text-[10px] text-gray-400 block font-normal">Role: {log.user_role}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-gray-700 text-[11px] block">{log.page_path || '-'}</span>
                          {log.feature_name && (
                            <span className="text-[10px] font-bold text-teal-700">{log.feature_name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-[220px] truncate" title={log.details || ''}>
                          {log.details || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-[10px]">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {activityLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No activity records found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
