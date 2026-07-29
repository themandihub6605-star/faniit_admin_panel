import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Percent } from 'lucide-react';
import { adminApi, type SiteSettings } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi
      .getSiteSettings()
      .then(setSettings)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await adminApi.updateSiteSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Site Settings</h1>
      <p className="mt-1 text-sm text-white/60">Platform-wide config — changes apply immediately, no redeploy needed.</p>

      {loading && (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading settings...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {!loading && settings && (
        <div className="mt-6 max-w-lg space-y-5 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <label className="block">
            <span className="block text-sm font-semibold text-white/80">Platform Commission</span>
            <span className="mb-1.5 block text-xs text-white/40">Cut taken from every session payment, donation, and campaign payout.</span>
            <div className="relative max-w-[160px]">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settings.platformCommissionPercent}
                onChange={(e) => setSettings({ ...settings, platformCommissionPercent: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-2.5 pl-4 pr-9 text-white focus:border-orange-400"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Support Email</span>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white focus:border-orange-400"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Homepage Banner Text</span>
            <input
              value={settings.homepageBannerText}
              onChange={(e) => setSettings({ ...settings, homepageBannerText: e.target.value })}
              placeholder="Leave empty to hide the banner"
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white focus:border-orange-400"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-white/80">Maintenance Mode</p>
              <p className="text-xs text-white/40">Shows a maintenance page to all visitors on the main site.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-white/15'}`}
            >
              <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {settings.maintenanceMode && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Maintenance Message</span>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white focus:border-orange-400"
              />
            </label>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 size={16} /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}