import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ShieldAlert, ArrowRightCircle, RotateCcw } from 'lucide-react';
import { adminApi, type DisputedCampaign } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export default function AdminEscrowDisputes() {
  const [disputes, setDisputes] = useState<DisputedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listDisputedEscrows()
      .then(setDisputes)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRelease = async (campaign: DisputedCampaign) => {
    if (!window.confirm(`Release ${formatRupees(campaign.budget)} to the creator for "${campaign.title}"? This can't be undone.`)) return;
    setActingOn(campaign._id);
    setError('');
    try {
      await adminApi.releaseEscrow(campaign._id);
      setDisputes((prev) => prev.filter((d) => d._id !== campaign._id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  const handleRefund = async (campaign: DisputedCampaign) => {
    if (!window.confirm(`Refund ${formatRupees(campaign.budget)} back to the brand for "${campaign.title}"? This can't be undone.`)) return;
    setActingOn(campaign._id);
    setError('');
    try {
      await adminApi.refundEscrow(campaign._id);
      setDisputes((prev) => prev.filter((d) => d._id !== campaign._id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Escrow Disputes</h1>
      <p className="mt-1 text-sm text-white/60">
        Campaigns where the brand and creator disagree on delivery. Decide who the held funds go to — this is final.
      </p>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading disputes...</p>
        </div>
      )}

      {!loading && disputes.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
          <ShieldAlert size={28} />
          <p className="text-sm">No disputed campaigns right now.</p>
        </div>
      )}

      {!loading && disputes.length > 0 && (
        <div className="mt-6 space-y-4">
          {disputes.map((d) => (
            <div key={d._id} className="rounded-2xl border border-red-500/20 bg-navy-800/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    <p className="font-bold text-white">{d.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-white/50">
                    Brand: <span className="text-white/80">{d.brand?.companyName || 'Unknown'}</span>
                    {d.brand?.user?.email && <span className="text-white/40"> ({d.brand.user.email})</span>}
                  </p>
                  <p className="text-sm text-white/50">
                    Creator: <span className="text-white/80">{d.assignedCreator?.user?.name || 'Unassigned'}</span>
                    {d.assignedCreator?.user?.email && <span className="text-white/40"> ({d.assignedCreator.user.email})</span>}
                  </p>
                  <p className="mt-2 text-lg font-bold text-emerald-400">{formatRupees(d.budget)} held in escrow</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => handleRelease(d)}
                    disabled={actingOn === d._id}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {actingOn === d._id ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightCircle size={14} />}
                    Release to Creator
                  </button>
                  <button
                    onClick={() => handleRefund(d)}
                    disabled={actingOn === d._id}
                    className="flex items-center gap-1.5 rounded-full border border-orange-400/40 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/10 disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Refund Brand
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}