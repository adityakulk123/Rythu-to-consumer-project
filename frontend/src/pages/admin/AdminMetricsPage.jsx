import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Wifi, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar
} from 'lucide-react';

const AdminMetricsPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchMetrics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/admin/metrics?skip=${page * pageSize}&limit=${pageSize}`);
      const data = res.data;
      setMetrics(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError('Unable to load server metrics from Supabase PostgreSQL. Please verify your connection or try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [page]);

  // Helpers to format bytes and uptime
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getCpuBadgeColor = (percent) => {
    if (percent < 50) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (percent < 80) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const latest = metrics.length > 0 ? metrics[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-700" />
              Automated Server Monitoring
            </span>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              Interval: Every 3 Hours (180 mins)
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-2">Server Telemetry &amp; Diagnostics</h1>
          <p className="text-xs text-gray-500">
            Real-time server resource utilization captured automatically and stored in Supabase PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#1B4332]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Quick Status KPI Cards for Latest Snapshot */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
              <span>CPU Usage</span>
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{latest.cpu_percent}%</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(latest.cpu_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
              <span>RAM Used</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900">{latest.ram_percent}%</p>
            <p className="text-[11px] text-gray-500 font-medium">
              {formatBytes(latest.ram_used)} / {formatBytes(latest.ram_total)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
              <span>Disk Used</span>
              <HardDrive className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900">{latest.disk_percent}%</p>
            <p className="text-[11px] text-gray-500 font-medium">
              {formatBytes(latest.disk_used)} / {formatBytes(latest.disk_total)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
              <span>Network I/O</span>
              <Wifi className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs space-y-0.5 pt-1">
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <ArrowUpRight className="w-3 h-3" /> Sent: {formatBytes(latest.network_bytes_sent)}
              </div>
              <div className="flex items-center gap-1 text-blue-700 font-bold">
                <ArrowDownLeft className="w-3 h-3" /> Recv: {formatBytes(latest.network_bytes_recv)}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
              <span>Host Uptime</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-lg font-black text-teal-950 pt-1">{formatUptime(latest.server_uptime_seconds)}</p>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {latest.server_uptime_seconds?.toLocaleString()} secs
            </p>
          </div>

        </div>
      )}

      {/* Main Metrics Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Table Top Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1B4332]" />
            <h3 className="font-extrabold text-sm text-gray-900">
              Supabase PostgreSQL &bull; <code>metrics</code> Records
            </h3>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {total} Total Collections
            </span>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sorted by latest collection timestamp first</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#1B4332] animate-spin" />
            <p className="text-xs font-bold text-gray-500">Loading server metrics from Supabase PostgreSQL...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 m-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-bold text-red-900">{error}</p>
            <button
              onClick={() => fetchMetrics()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && metrics.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <Server className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No server metrics collected yet.</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              The automated metrics job captures server statistics once every 3 hours. New records will appear here automatically.
            </p>
          </div>
        )}

        {/* Metrics Data Table */}
        {!loading && !error && metrics.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-[#F8F9FA] text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4"># ID</th>
                  <th className="py-3 px-4">Collected At (UTC / Local)</th>
                  <th className="py-3 px-4">CPU %</th>
                  <th className="py-3 px-4">RAM Utilization</th>
                  <th className="py-3 px-4">Disk Utilization</th>
                  <th className="py-3 px-4">Network Sent</th>
                  <th className="py-3 px-4">Network Recv</th>
                  <th className="py-3 px-4">Server Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {metrics.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors">
                    
                    {/* ID */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-extrabold">
                          {row.id}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            LATEST
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{formatDate(row.collected_at)}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{row.collected_at}</div>
                    </td>

                    {/* CPU Usage */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full border text-[11px] ${getCpuBadgeColor(row.cpu_percent)}`}>
                        {row.cpu_percent}%
                      </span>
                    </td>

                    {/* RAM */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{row.ram_percent}%</div>
                      <div className="text-[10px] text-gray-500">
                        {formatBytes(row.ram_used)} / {formatBytes(row.ram_total)}
                      </div>
                    </td>

                    {/* Disk */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{row.disk_percent}%</div>
                      <div className="text-[10px] text-gray-500">
                        {formatBytes(row.disk_used)} / {formatBytes(row.disk_total)}
                      </div>
                    </td>

                    {/* Network Sent */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-800">
                      {formatBytes(row.network_bytes_sent)}
                    </td>

                    {/* Network Recv */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-800">
                      {formatBytes(row.network_bytes_recv)}
                    </td>

                    {/* Uptime */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800">{formatUptime(row.server_uptime_seconds)}</div>
                      <div className="text-[10px] text-gray-400">{Math.round(row.server_uptime_seconds)}s</div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Pagination */}
        {!loading && !error && total > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminMetricsPage;
