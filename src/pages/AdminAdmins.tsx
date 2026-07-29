import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import { adminApi, type AdminUser } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass + '!';
}

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listAdmins()
      .then(setAdmins)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await adminApi.createAdmin({ name, email, password });
      setCreated({ email, password });
      setName('');
      setEmail('');
      setPassword(generatePassword());
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Accounts</h1>
      <p className="mt-1 text-sm text-white/60">Everyone who has access to this panel.</p>

      <form onSubmit={handleCreate} className="mt-6 max-w-lg space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white/80">
          <Plus size={15} /> Add New Admin
        </h2>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {created && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-bold text-emerald-300">
              <CheckCircle2 size={14} /> Admin created — share these credentials:
            </p>
            <p className="mt-2 text-white/80">
              Email: <span className="font-mono">{created.email}</span>
            </p>
            <p className="text-white/80">
              Password: <span className="font-mono">{created.password}</span>
            </p>
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Temporary Password</span>
          <div className="flex gap-2">
            <input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-orange-400"
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="shrink-0 rounded-xl border border-white/15 px-3 text-xs font-bold text-white/70 hover:bg-white/5"
            >
              Regenerate
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={creating}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Admin'}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/40">All Admins</h2>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-white/50">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((a) => (
              <div key={a._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/60 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                  <ShieldCheck size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-white/50">{a.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}