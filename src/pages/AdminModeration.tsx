import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Video, Briefcase, Star, Trash2, EyeOff, Flag } from 'lucide-react';
import { adminApi, type AdminSession, type AdminCampaign, type AdminReview } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const TABS = [
  { key: 'sessions', label: 'Sessions', icon: Video },
  { key: 'campaigns', label: 'Campaigns', icon: Briefcase },
  { key: 'reviews', label: 'Reviews', icon: Star },
] as const;

export default function AdminModeration() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('sessions');
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    const request =
      tab === 'sessions' ? adminApi.listAllSessions() : tab === 'campaigns' ? adminApi.listAllCampaigns() : adminApi.listAllReviews(flaggedOnly);

    request
      .then((data) => {
        if (tab === 'sessions') setSessions(data as AdminSession[]);
        else if (tab === 'campaigns') setCampaigns(data as AdminCampaign[]);
        else setReviews(data as AdminReview[]);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab, flaggedOnly]);

  const handleRemoveSession = async (id: string) => {
    if (!window.confirm('Remove this session? It will be cancelled for everyone.')) return;
    setActingOn(id);
    try {
      await adminApi.removeSession(id);
      setSessions((prev) => prev.map((s) => (s._id === id ? { ...s, isCancelled: true } : s)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  const handleHideReview = async (id: string) => {
    if (!window.confirm('Hide this review from public view?')) return;
    setActingOn(id);
    try {
      await adminApi.hideReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Content Moderation</h1>
      <p className="mt-1 text-sm text-white/60">Live sessions, brand campaigns, and reviews across the platform.</p>

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-navy-800/50 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-orange-500/15 text-orange-300' : 'text-white/50 hover:text-white/80'
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        <label className="mt-4 flex w-fit items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="rounded accent-orange-500" />
          Flagged only
        </label>
      )}

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Sessions */}
      {!loading && tab === 'sessions' && (
        <div className="mt-6 space-y-3">
          {sessions.length === 0 && <p className="text-center text-white/50">No sessions found.</p>}
          {sessions.map((s) => (
            <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-4">
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-xs text-white/50">
                  {s.creator?.user?.name || 'Unknown creator'} · {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              {s.isCancelled ? (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">Cancelled</span>
              ) : (
                <button
                  onClick={() => handleRemoveSession(s._id)}
                  disabled={actingOn === s._id}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {actingOn === s._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Campaigns */}
      {!loading && tab === 'campaigns' && (
        <div className="mt-6 space-y-3">
          {campaigns.length === 0 && <p className="text-center text-white/50">No campaigns found.</p>}
          {campaigns.map((c) => (
            <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-4">
              <div>
                <p className="font-semibold text-white">{c.title}</p>
                <p className="text-xs text-white/50">{c.brand?.companyName || 'Unknown brand'} · {formatRupees(c.budget)}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/70">{c.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      {!loading && tab === 'reviews' && (
        <div className="mt-6 space-y-3">
          {reviews.length === 0 && <p className="text-center text-white/50">No reviews found.</p>}
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                    ))}
                    {r.isFlagged && (
                      <span className="ml-2 flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        <Flag size={9} /> Flagged
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-white/80">{r.comment || <span className="text-white/30">No comment</span>}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {r.fromUser?.name || 'Someone'} → {r.toUser?.name || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleHideReview(r._id)}
                  disabled={actingOn === r._id}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {actingOn === r._id ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />} Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}