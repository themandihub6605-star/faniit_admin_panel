import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Users2, Sparkles, Building2, Video, Briefcase, Wallet, Percent, Lock } from 'lucide-react';
import { adminApi, type AdminAnalytics } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const STATS = (a: AdminAnalytics) => [
  { label: 'Total Users', value: a.totalUsers.toLocaleString('en-IN'), icon: Users2, color: 'text-orange-300 bg-orange-500/15' },
  { label: 'Creators', value: a.totalCreators.toLocaleString('en-IN'), icon: Sparkles, color: 'text-pink-300 bg-pink-500/15' },
  { label: 'Brands', value: a.totalBrands.toLocaleString('en-IN'), icon: Building2, color: 'text-sky-300 bg-sky-500/15' },
  { label: 'Sessions', value: a.totalSessions.toLocaleString('en-IN'), icon: Video, color: 'text-purple-300 bg-purple-500/15' },
  { label: 'Campaigns', value: a.totalCampaigns.toLocaleString('en-IN'), icon: Briefcase, color: 'text-yellow-300 bg-yellow-500/15' },
  { label: 'Total Revenue', value: formatRupees(a.totalRevenue), icon: Wallet, color: 'text-emerald-300 bg-emerald-500/15' },
  { label: 'Platform Commission', value: formatRupees(a.totalPlatformCommission), icon: Percent, color: 'text-orange-300 bg-orange-500/15' },
  { label: 'Held in Escrow', value: formatRupees(a.totalInEscrow), icon: Lock, color: 'text-red-300 bg-red-500/15' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-8">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Overview</h1>
      <p className="mt-1 text-sm text-white/60">Platform-wide numbers, live from the database.</p>

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading analytics...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {!loading && data && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {STATS(data).map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon size={17} />
              </span>
              <p className="mt-4 text-xl font-bold text-white sm:text-2xl">{s.value}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
