import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Ban, RotateCcw, Star, Users2, Wallet } from 'lucide-react';
import { adminApi, type UserDetail } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    adminApi
      .getUserDetail(id)
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleToggleSuspend = async () => {
    if (!data || !id) return;
    setActing(true);
    try {
      if (data.user.isSuspended) {
        await adminApi.reinstateUser(id);
      } else {
        const reason = window.prompt('Reason for suspension (optional):') || '';
        await adminApi.suspendUser(id, reason);
      }
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading user...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-white/60">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm">{error || "Couldn't load this user"}</p>
      </div>
    );
  }

  const { user, roleProfile, transactions, reviews, referredCount } = data;

  return (
    <div className="pt-8 pb-16">
      <button onClick={() => navigate('/users')} className="flex items-center gap-1.5 text-sm font-semibold text-white/50 hover:text-white/80">
        <ArrowLeft size={15} /> Back to Users
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-navy-800/60 p-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 text-xl font-bold text-orange-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-white/50">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold capitalize text-white/70">{user.role}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', user.isSuspended ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300')}>
                {user.isSuspended ? 'Suspended' : 'Active'}
              </span>
              {user.phone && <span className="text-xs text-white/40">{user.phone}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleSuspend}
          disabled={acting}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-50',
            user.isSuspended ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'
          )}
        >
          {acting ? <Loader2 size={14} className="animate-spin" /> : user.isSuspended ? <RotateCcw size={14} /> : <Ban size={14} />}
          {user.isSuspended ? 'Reinstate' : 'Suspend'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
          <Wallet size={16} className="text-emerald-300" />
          <p className="mt-2 text-lg font-bold text-white">{formatRupees(user.walletBalance || 0)}</p>
          <p className="text-xs text-white/50">Wallet balance</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
          <Users2 size={16} className="text-orange-300" />
          <p className="mt-2 text-lg font-bold text-white">{referredCount}</p>
          <p className="text-xs text-white/50">People referred</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
          <Star size={16} className="text-yellow-300" />
          <p className="mt-2 text-lg font-bold text-white">{reviews.length}</p>
          <p className="text-xs text-white/50">Reviews received</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
          <p className="mt-2 font-mono text-sm font-bold text-white">{user.referralCode || '—'}</p>
          <p className="text-xs text-white/50">Referral code</p>
        </div>
      </div>

      {roleProfile && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/40">{user.role} Profile</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(roleProfile)
              .filter(([k, v]) => !['_id', '__v', 'user'].includes(k) && v !== null && v !== '' && typeof v !== 'object')
              .map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/5 py-1.5 text-sm">
                  <span className="capitalize text-white/40">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-white/80">{String(v)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/40">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No transactions.</p>
        ) : (
          <div className="mt-3 divide-y divide-white/5">
            {transactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="capitalize text-white/70">{t.type.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-white">{formatRupees(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/40">Reviews Received</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No reviews yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="border-b border-white/5 pb-3 text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                  ))}
                  <span className="ml-2 text-xs text-white/40">from {r.fromUser?.name || 'Someone'}</span>
                </div>
                {r.comment && <p className="mt-1 text-white/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}