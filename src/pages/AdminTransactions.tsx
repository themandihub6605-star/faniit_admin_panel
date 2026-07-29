import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, type AdminTransaction } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const TYPE_LABELS: Record<string, string> = {
  session_payment: 'Session Payment',
  donation: 'Donation',
  campaign_escrow_deposit: 'Escrow Deposit',
  campaign_payout: 'Campaign Payout',
  agency_commission: 'Agency Commission',
  referral_commission: 'Referral Commission',
  platform_commission: 'Platform Commission',
  refund: 'Refund',
};

const TYPE_OPTIONS = ['', ...Object.keys(TYPE_LABELS)];
const STATUS_OPTIONS = ['', 'pending', 'in_escrow', 'success', 'failed', 'refunded', 'released'];

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-300',
  released: 'bg-emerald-500/15 text-emerald-300',
  pending: 'bg-yellow-500/15 text-yellow-300',
  in_escrow: 'bg-sky-500/15 text-sky-300',
  failed: 'bg-red-500/15 text-red-300',
  refunded: 'bg-orange-500/15 text-orange-300',
};

export default function AdminTransactions() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminApi
      .listAllTransactions({ type: type || undefined, status: status || undefined, page, limit: 25 })
      .then((d) => {
        setTransactions(d.transactions);
        setPages(d.pages);
        setTotal(d.total);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [type, status, page]);

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">All Transactions</h1>
      <p className="mt-1 text-sm text-white/60">Every payment on the platform — {total.toLocaleString('en-IN')} total.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded-full border border-white/10 bg-navy-800/60 px-4 py-2.5 text-sm text-white focus:border-orange-400"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t} className="bg-[#141414]">
              {t ? TYPE_LABELS[t] : 'All types'}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-full border border-white/10 bg-navy-800/60 px-4 py-2.5 text-sm capitalize text-white focus:border-orange-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-[#141414] capitalize">
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
          <Receipt size={28} />
          <p className="text-sm">No transactions match these filters.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-800/60 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((t) => (
                  <tr key={t._id} className="bg-navy-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{TYPE_LABELS[t.type] || t.type}</td>
                    <td className="px-4 py-3 text-white/60">{t.from?.name || '—'}</td>
                    <td className="px-4 py-3 text-white/60">{t.to?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold capitalize', STATUS_COLORS[t.status] || 'bg-white/10 text-white/60')}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{formatRupees(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-white/40">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 disabled:opacity-30"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}