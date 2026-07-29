import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

const ROLES = [
  { value: '', label: 'Everyone' },
  { value: 'fan', label: 'Fans only' },
  { value: 'creator', label: 'Creators only' },
  { value: 'brand', label: 'Brands only' },
  { value: 'agency', label: 'Agencies only' },
];

export default function AdminBroadcast() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const targetLabel = ROLES.find((r) => r.value === role)?.label || 'Everyone';
    if (!window.confirm(`Send this notification to "${targetLabel}"? This can't be undone.`)) return;

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await adminApi.broadcastNotification({ title: title.trim(), message: message.trim(), role: role || undefined });
      setResult(res.sentTo);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Broadcast Notification</h1>
      <p className="mt-1 text-sm text-white/60">Send the same notification to everyone, or a specific account type.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {result !== null && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Sent to {result} user{result === 1 ? '' : 's'}.
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Send to</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white focus:border-orange-400"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-[#141414]">
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New feature: Live Sessions"
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Message</span>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you want to tell them?"
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
          Send Notification
        </button>
      </form>
    </div>
  );
}