import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Plus, Pencil, X, Layers } from 'lucide-react';
import { adminApi, type AdminSubscriptionPlan } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

const EMPTY_FORM = {
  name: '',
  slug: '',
  appliesTo: 'creator' as 'creator' | 'brand',
  price: 0, // rupees in the form, converted to paise on submit
  billingCycle: 'monthly' as 'monthly' | 'yearly',
  isDefault: false,
  isActive: true,
  sortOrder: 0,
  proposalLimit: '' as string | number,
  extraProposalCost: 3, // rupees, converted to paise on submit
  platformFeePercent: 9,
  campaignAccessTier: 'lite_only' as 'lite_only' | 'all',
  hasEarlyAccess: false,
  campaignPostLimit: '' as string | number,
  campaignVisibilityTier: 'lite' as 'lite' | 'exclusive',
  canSetApplicantLimit: false,
  isFeaturedListing: false,
  description: '',
  perks: '', // newline separated in the form, split into array on submit
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function AdminSubscriptionPlans() {
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'creator' | 'brand'>('creator');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listSubscriptionPlans()
      .then(setPlans)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, appliesTo: tab, platformFeePercent: tab === 'creator' ? 9 : 0 });
    setFormOpen(true);
  };

  const openEdit = (plan: AdminSubscriptionPlan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name,
      slug: plan.slug,
      appliesTo: plan.appliesTo,
      price: plan.price / 100,
      billingCycle: plan.billingCycle,
      isDefault: plan.isDefault,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      proposalLimit: plan.proposalLimit ?? '',
      extraProposalCost: plan.extraProposalCost / 100,
      platformFeePercent: plan.platformFeePercent,
      campaignAccessTier: plan.campaignAccessTier,
      hasEarlyAccess: plan.hasEarlyAccess,
      campaignPostLimit: plan.campaignPostLimit ?? '',
      campaignVisibilityTier: plan.campaignVisibilityTier,
      canSetApplicantLimit: plan.canSetApplicantLimit,
      isFeaturedListing: plan.isFeaturedListing,
      description: plan.description,
      perks: plan.perks.join('\n'),
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        appliesTo: form.appliesTo,
        price: Math.round(form.price * 100),
        billingCycle: form.billingCycle,
        isDefault: form.isDefault,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        proposalLimit: form.proposalLimit === '' ? null : Number(form.proposalLimit),
        extraProposalCost: Math.round(form.extraProposalCost * 100),
        platformFeePercent: form.platformFeePercent,
        campaignAccessTier: form.campaignAccessTier,
        hasEarlyAccess: form.hasEarlyAccess,
        campaignPostLimit: form.campaignPostLimit === '' ? null : Number(form.campaignPostLimit),
        campaignVisibilityTier: form.campaignVisibilityTier,
        canSetApplicantLimit: form.canSetApplicantLimit,
        isFeaturedListing: form.isFeaturedListing,
        description: form.description,
        perks: form.perks.split('\n').map((p) => p.trim()).filter(Boolean),
      };

      if (editingId) {
        const updated = await adminApi.updateSubscriptionPlan(editingId, payload);
        setPlans((prev) => prev.map((p) => (p._id === editingId ? updated : p)));
      } else {
        const created = await adminApi.createSubscriptionPlan(payload);
        setPlans((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: AdminSubscriptionPlan) => {
    setError('');
    try {
      if (plan.isActive) {
        const updated = await adminApi.deleteSubscriptionPlan(plan._id);
        setPlans((prev) => prev.map((p) => (p._id === plan._id ? updated : p)));
      } else {
        const updated = await adminApi.updateSubscriptionPlan(plan._id, { isActive: true });
        setPlans((prev) => prev.map((p) => (p._id === plan._id ? updated : p)));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const visiblePlans = plans.filter((p) => p.appliesTo === tab);

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Subscription Plans</h1>
      <p className="mt-1 text-sm text-white/60">
        Manage Creator and Brand subscription tiers — pricing, limits, and perks. Changes apply immediately platform-wide.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-white/10 bg-navy-800/50 p-1">
          {(['creator', 'brand'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors',
                tab === t ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={14} /> New Plan
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading plans...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlans.map((plan) => (
            <div
              key={plan._id}
              className={cn(
                'rounded-2xl border p-5',
                plan.isActive ? 'border-white/10 bg-navy-800/60' : 'border-white/5 bg-navy-800/30 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
                      <Layers size={14} />
                    </span>
                    <p className="font-bold text-white">{plan.name}</p>
                    {plan.isDefault && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">Default</span>
                    )}
                    {plan.isFeaturedListing && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-300">Featured</span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {plan.price === 0 ? 'Free' : formatRupees(plan.price)}
                    {plan.price > 0 && <span className="text-xs font-normal text-white/40"> /{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>}
                  </p>
                </div>
                <button onClick={() => openEdit(plan)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">
                  <Pencil size={14} />
                </button>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-white/60">
                {plan.appliesTo === 'creator' ? (
                  <>
                    <p>Proposals: {plan.proposalLimit ?? 'Unlimited'}/cycle</p>
                    <p>Extra proposal: {formatRupees(plan.extraProposalCost)}</p>
                    <p>Platform fee: {plan.platformFeePercent}%</p>
                    <p>Campaign access: {plan.campaignAccessTier === 'all' ? 'Lite + Exclusive' : 'Lite only'}</p>
                    <p>Early access: {plan.hasEarlyAccess ? 'Yes' : 'No'}</p>
                  </>
                ) : (
                  <>
                    <p>Campaigns: {plan.campaignPostLimit ?? 'Unlimited'}/cycle</p>
                    <p>Visibility: {plan.campaignVisibilityTier === 'exclusive' ? 'Exclusive' : 'Lite'}</p>
                    <p>Applicant limit: {plan.canSetApplicantLimit ? 'Can set' : 'Not allowed'}</p>
                  </>
                )}
              </div>

              <button
                onClick={() => handleToggleActive(plan)}
                className={cn(
                  'mt-4 w-full rounded-full border py-1.5 text-xs font-bold',
                  plan.isActive ? 'border-red-500/40 text-red-300' : 'border-emerald-500/40 text-emerald-300'
                )}
              >
                {plan.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          ))}

          {visiblePlans.length === 0 && (
            <p className="col-span-full text-center text-sm text-white/40">No {tab} plans yet — create one to get started.</p>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setFormOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-navy-900 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-white/60">Name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-white/60">Slug</span>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="creator-pro"
                    className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-white/60">Applies to</span>
                  <select
                    value={form.appliesTo}
                    onChange={(e) => setForm((f) => ({ ...f, appliesTo: e.target.value as 'creator' | 'brand' }))}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                  >
                    <option value="creator" className="bg-[#141414]">Creator</option>
                    <option value="brand" className="bg-[#141414]">Brand</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-white/60">Billing cycle</span>
                  <select
                    value={form.billingCycle}
                    onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value as 'monthly' | 'yearly' }))}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                  >
                    <option value="monthly" className="bg-[#141414]">Monthly</option>
                    <option value="yearly" className="bg-[#141414]">Yearly</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/60">Price (₹, 0 for free)</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                />
              </label>

              {form.appliesTo === 'creator' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Proposal limit (blank = unlimited)</span>
                      <input
                        type="number"
                        min="0"
                        value={form.proposalLimit}
                        onChange={(e) => setForm((f) => ({ ...f, proposalLimit: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Extra proposal cost (₹)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.extraProposalCost}
                        onChange={(e) => setForm((f) => ({ ...f, extraProposalCost: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Platform fee (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.platformFeePercent}
                        onChange={(e) => setForm((f) => ({ ...f, platformFeePercent: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Campaign access</span>
                      <select
                        value={form.campaignAccessTier}
                        onChange={(e) => setForm((f) => ({ ...f, campaignAccessTier: e.target.value as 'lite_only' | 'all' }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      >
                        <option value="lite_only" className="bg-[#141414]">Lite only</option>
                        <option value="all" className="bg-[#141414]">Lite + Exclusive</option>
                      </select>
                    </label>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.hasEarlyAccess}
                      onChange={(e) => setForm((f) => ({ ...f, hasEarlyAccess: e.target.checked }))}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Early access to exclusive campaigns
                  </label>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Campaign post limit (blank = unlimited)</span>
                      <input
                        type="number"
                        min="0"
                        value={form.campaignPostLimit}
                        onChange={(e) => setForm((f) => ({ ...f, campaignPostLimit: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-white/60">Campaign visibility</span>
                      <select
                        value={form.campaignVisibilityTier}
                        onChange={(e) => setForm((f) => ({ ...f, campaignVisibilityTier: e.target.value as 'lite' | 'exclusive' }))}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                      >
                        <option value="lite" className="bg-[#141414]">Lite</option>
                        <option value="exclusive" className="bg-[#141414]">Exclusive</option>
                      </select>
                    </label>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.canSetApplicantLimit}
                      onChange={(e) => setForm((f) => ({ ...f, canSetApplicantLimit: e.target.checked }))}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Can set a max-applicants cap per campaign
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={form.isFeaturedListing}
                      onChange={(e) => setForm((f) => ({ ...f, isFeaturedListing: e.target.checked }))}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Featured listing (campaigns sort first)
                  </label>
                </>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/60">Description (shown on pricing page)</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/60">Perks (one per line)</span>
                <textarea
                  rows={4}
                  value={form.perks}
                  onChange={(e) => setForm((f) => ({ ...f, perks: e.target.value }))}
                  placeholder={'90 proposals/month\n5% platform fee\nStorefront access'}
                  className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-400"
                />
              </label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Default plan for new signups
                </label>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 accent-orange-500"
                  />
                  Active
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="mx-auto animate-spin" /> : editingId ? 'Save Changes' : 'Create Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}