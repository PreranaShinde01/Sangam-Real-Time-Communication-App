import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Video,
  FolderLock,
  Activity,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useTranslation } from '../store/useThemeStore';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem('sangam_token');
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setAuditLogs(l.logs);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>System Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Sangam Admin Console</h1>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>User Dashboard</span>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-brand-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{stats.userCount}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
                <span>Total Meetings</span>
                <Video className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{stats.roomCount}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
                <span>Active Rooms</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {stats.activeRooms}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
                <span>Shared Files</span>
                <FolderLock className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{stats.filesCount}</span>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'users' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'logs' ? 'bg-brand-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Security Audit Logs
              </button>
            </div>

            {activeTab === 'users' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          {/* Users Table */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/60 uppercase font-semibold text-slate-500 dark:text-slate-400 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">2FA</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.email || 'No email'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {u.isGuest ? 'Guest' : 'Registered'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold ${
                            u.twoFactorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Logs Table */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/60 uppercase font-semibold text-slate-500 dark:text-slate-400 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.action}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300">
                        {log.user ? log.user.name : 'System / Anonymous'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans text-xs">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
