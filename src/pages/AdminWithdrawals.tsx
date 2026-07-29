import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Wallet, Check, X, CreditCard } from 'lucide-react';
import { adminApi, type AdminWithdrawal } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const TABS = ['pending', 'paid', 'rejected'] as const;

export default function AdminWithdrawals() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listWithdrawals(tab)
      .then(setWithdrawals)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleMarkPaid = async (id: string) => {
    if (!window.confirm('Confirm you have actually sent this payout via UPI/bank transfer?')) return;
    setActingOn(id);
    try {
      await adminApi.markWithdrawalPaid(id);
      setWithdrawals((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Reason for rejecting (the amount will be refunded to their wallet):') || '';
    setActingOn(id);
    try {
      await adminApi.rejectWithdrawal(id, reason);
      setWithdrawals((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Withdrawal Requests</h1>
      <p className="mt-1 text-sm text-white/60">Payout requests from creators, brands, and agencies.</p>

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-navy-800/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-colors',
              tab === t ? 'bg-orange-500/15 text-orange-300' : 'text-white/50 hover:text-white/80'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading withdrawals...</p>
        </div>
      )}

      {!loading && withdrawals.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
          <Wallet size={28} />
          <p className="text-sm">No {tab} withdrawals.</p>
        </div>
      )}

      {!loading && withdrawals.length > 0 && (
        <div className="mt-6 space-y-3">
          {withdrawals.map((w) => (
            <div key={w._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <div>
                <p className="text-lg font-bold text-white">{formatRupees(w.amount)}</p>
                <p className="text-sm text-white/60">
                  {w.user?.name || 'Unknown'} <span className="text-white/40">({w.user?.role})</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
                  <CreditCard size={11} /> {w.payoutMethod.toUpperCase()}: {w.payoutDetails}
                </p>
                {w.adminNote && <p className="mt-1 text-xs text-red-300">Note: {w.adminNote}</p>}
                <p className="mt-1 text-xs text-white/30">{new Date(w.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>

              {tab === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkPaid(w._id)}
                    disabled={actingOn === w._id}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {actingOn === w._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Mark Paid
                  </button>
                  <button
                    onClick={() => handleReject(w._id)}
                    disabled={actingOn === w._id}
                    className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}