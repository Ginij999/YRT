import React, { useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  Database,
  FileText,
  FolderKanban,
  Mail,
  Trophy,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { ActivityLog } from '../../types/cms';

interface OverviewStats {
  visitors: number;
  portfolioProjects: number;
  publishedBlogs: number;
  staffMembers: number;
  activePositions: number;
  jobApplications: number;
  unreadMessages: number;
  eventsCount: number;
  servicesCount: number;
}

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { apiFetch } = useSite();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [dbMode, setDbMode] = useState<string>('local_persistent');
  const [dbError, setDbError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOverview = () => {
    setLoading(true);
    apiFetch('/api/admin/overview')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setDbMode(data.dbMode);
        setDbError(data.dbError || null);
        setLogs(data.recentLogs || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOverview();
  }, [apiFetch]);

  const handleReconnectDb = async () => {
    setReconnecting(true);
    try {
      const res = await apiFetch('/api/admin/reconnect-db', { method: 'POST' });
      const data = await res.json();
      setDbMode(data.dbMode);
      setDbError(data.error || null);
      if (data.ok) {
        loadOverview();
      }
    } finally {
      setReconnecting(false);
    }
  };

  const kpis = [
    { label: 'Total Website Visitors', value: stats?.visitors ?? 0, icon: Eye, tab: 'settings' },
    { label: 'Portfolio Projects', value: stats?.portfolioProjects ?? 0, icon: FolderKanban, tab: 'portfolio' },
    { label: 'Published Blogs', value: stats?.publishedBlogs ?? 0, icon: FileText, tab: 'blog' },
    { label: 'Active Staff Members', value: stats?.staffMembers ?? 0, icon: Users, tab: 'staff' },
    { label: 'Active Open Positions', value: stats?.activePositions ?? 0, icon: Briefcase, tab: 'careers' },
    { label: 'Job Applications', value: stats?.jobApplications ?? 0, icon: FileText, tab: 'applications' },
    { label: 'Unread Contact Messages', value: stats?.unreadMessages ?? 0, icon: Mail, tab: 'messages' },
    { label: 'Events & Tournaments', value: stats?.eventsCount ?? 0, icon: Trophy, tab: 'events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CMS Executive Overview</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time metrics across public website pages, recruitment pipeline, and content repositories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 border border-white/10 bg-[#111115] text-xs flex items-center gap-2">
            <Database className={`w-3.5 h-3.5 ${dbMode === 'mongodb' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-neutral-300">
              Storage Engine:{' '}
              <strong className="text-white">
                {dbMode === 'mongodb' ? 'MongoDB Atlas (Connected)' : 'Persistent Local Store (/data/cms-db.json)'}
              </strong>
            </span>
          </div>

          {dbMode !== 'mongodb' && (
            <button
              type="button"
              onClick={handleReconnectDb}
              disabled={reconnecting}
              className="px-3 py-2 border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
              <span>{reconnecting ? 'Connecting...' : 'Retry Atlas'}</span>
            </button>
          )}
        </div>
      </div>

      {dbMode !== 'mongodb' && dbError && (
        <div className="p-4 border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="text-amber-300">MongoDB Atlas Standby Notice:</strong>{' '}
            Your CMS is currently saving safely to the persistent local store because Atlas rejected the cloud IP. Add{' '}
            <code className="px-1.5 py-0.5 bg-black/40 border border-white/10 text-white">0.0.0.0/0</code> under{' '}
            <strong>Network Access</strong> in MongoDB Atlas, then click <strong>Retry Atlas</strong>.
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigate(kpi.tab)}
              className="text-left p-5 bg-[#111115] border border-white/10 hover:border-white/25 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">{kpi.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold text-white font-mono-num tabular-nums">
                {loading ? '—' : kpi.value.toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Activity Audit Log */}
      <div className="bg-[#111115] border border-white/10">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="w-4 h-4 text-red-500" />
            <span>Recent CMS Activity</span>
          </div>
          <span className="text-xs text-neutral-400">Latest 15 actions</span>
        </div>

        <div className="divide-y divide-white/5">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">No activity logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 font-mono text-[11px] text-neutral-200">
                    {log.action}
                  </span>
                  <span className="text-white font-medium">{log.entityTitle}</span>
                  <span className="text-neutral-400">({log.entityType})</span>
                </div>
                <div className="text-neutral-400 tabular-nums">
                  {log.adminName} · {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
