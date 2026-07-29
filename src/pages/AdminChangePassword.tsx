import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function AdminChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await adminApi.changeMyPassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Change Password</h1>
      <p className="mt-1 text-sm text-white/60">Update your own Admin Panel login password.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Password updated successfully.
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Current Password</span>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-2.5 pl-11 pr-11 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">New Password</span>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-2.5 pl-11 pr-11 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
            <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="mt-1 block text-xs text-white/40">At least 8 characters.</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-white/80">Confirm New Password</span>
          <input
            type={showNew ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </div>
  );
}