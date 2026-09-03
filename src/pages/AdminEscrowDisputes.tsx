import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ShieldAlert, Paperclip, ExternalLink, CheckCircle2 } from 'lucide-react';
import { disputeApi, type ApiDispute, type DisputeOutcome } from '@/services/disputeApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

const OUTCOME_OPTIONS: { value: DisputeOutcome; label: string; description: string }[] = [
  { value: 'full_to_creator', label: 'Full amount to Creator', description: 'The submitted work is acceptable — release the full milestone amount.' },
  { value: 'partial', label: 'Partial amount to Creator', description: 'Some work was delivered — split the milestone between creator and refund.' },
  { value: 'refund_to_brand', label: 'Full refund to Brand', description: 'The work does not meet the brief — refund the brand in full.' },
  { value: 'revision_required', label: 'Revision required', description: 'No money moves — send the milestone back to the creator to redo, still funded.' },
];

function DisputeCard({ dispute, onResolved }: { dispute: ApiDispute; onResolved: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [outcome, setOutcome] = useState<DisputeOutcome | null>(null);
  const [creatorAmount, setCreatorAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  const milestone = dispute.milestone;

  const handleResolve = async () => {
    if (!outcome) return;
    if (outcome === 'partial') {
      const amount = Math.round(parseFloat(creatorAmount || '0') * 100);
      if (!amount || amount <= 0 || amount >= milestone.amount) {
        setError('Enter a creator amount between ₹0 and the milestone amount for a partial resolution');
        return;
      }
    }
    if (!window.confirm(`Confirm resolution: ${OUTCOME_OPTIONS.find((o) => o.value === outcome)?.label}? This can't be undone.`)) return;

    setResolving(true);
    setError('');
    try {
      await disputeApi.resolve(dispute._id, {
        outcome,
        creatorAmount: outcome === 'partial' ? Math.round(parseFloat(creatorAmount) * 100) : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });
      onResolved(dispute._id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-500/20 bg-navy-800/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {dispute.campaign.brand.companyName} · {dispute.campaign.title}
            </p>
          </div>
          <p className="mt-1 text-sm font-bold text-white">{milestone.title}</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-400">{formatRupees(milestone.amount)} held in escrow</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">Open · {formatDate(dispute.createdAt)}</span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-navy-900/40 p-4">
        <p className="text-xs font-bold text-white/80">Brand's reason ({dispute.raisedBy.name})</p>
        <p className="mt-1 text-sm text-white/70">{dispute.reason}</p>
        {dispute.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {dispute.attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-orange-300 hover:underline">
                <Paperclip size={11} /> {a.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline"
      >
        {expanded ? 'Hide' : 'View'} creator's submission <ExternalLink size={11} />
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl border border-white/10 bg-navy-900/40 p-4">
          <p className="text-xs font-bold text-white/80">Creator's submission</p>
          {milestone.submissionDescription && <p className="mt-1 text-sm text-white/70">{milestone.submissionDescription}</p>}
          {(milestone.submissionLinks || []).filter(Boolean).map((link, i) => (
            <a key={i} href={link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-orange-300 hover:underline">
              {link}
            </a>
          ))}
          {(milestone.submissionAttachments || []).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-orange-300 hover:underline">
              <Paperclip size={11} /> {a.name}
            </a>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Resolve this dispute</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OUTCOME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOutcome(opt.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                outcome === opt.value ? 'border-orange-400/60 bg-orange-500/10' : 'border-white/10 hover:border-white/20'
              )}
            >
              <p className="text-sm font-bold text-white">{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-white/50">{opt.description}</p>
            </button>
          ))}
        </div>

        {outcome === 'partial' && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-white/60">Amount to Creator (₹, out of {formatRupees(milestone.amount)})</span>
            <input
              type="number"
              value={creatorAmount}
              onChange={(e) => setCreatorAmount(e.target.value)}
              placeholder={`e.g. ${(milestone.amount / 100 / 2).toFixed(0)}`}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>
        )}

        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold text-white/60">Admin notes (optional, internal)</span>
          <textarea
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
          />
        </label>

        <button
          onClick={handleResolve}
          disabled={!outcome || resolving}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {resolving ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Resolution'}
        </button>
      </div>
    </div>
  );
}

export default function AdminEscrowDisputes() {
  const [disputes, setDisputes] = useState<ApiDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justResolved, setJustResolved] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    disputeApi
      .listOpen()
      .then(setDisputes)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleResolved = (id: string) => {
    setDisputes((prev) => prev.filter((d) => d._id !== id));
    setJustResolved(id);
    setTimeout(() => setJustResolved(null), 3000);
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Escrow Disputes</h1>
      <p className="mt-1 text-sm text-white/60">
        Milestones where the brand raised a dispute instead of approving. Review both sides' evidence and decide how the held funds split — this is final.
      </p>

      {justResolved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0" /> Dispute resolved.
        </div>
      )}

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

      {!loading && !error && disputes.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
          <ShieldAlert size={28} />
          <p className="text-sm">No disputed milestones right now.</p>
        </div>
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="mt-6 space-y-4">
          {disputes.map((d) => (
            <DisputeCard key={d._id} dispute={d} onResolved={handleResolved} />
          ))}
        </div>
      )}
    </div>
  );
}