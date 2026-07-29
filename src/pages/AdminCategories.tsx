import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, RotateCcw, Tag } from 'lucide-react';
import { adminApi, type AdminCategory } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listCategories()
      .then(setCategories)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setError('');
    try {
      const created = await adminApi.createCategory({ label: newLabel.trim(), icon: newIcon.trim() });
      setCategories((prev) => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)));
      setNewLabel('');
      setNewIcon('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategory) => {
    setActingOn(cat._id);
    setError('');
    try {
      if (cat.isActive) {
        await adminApi.deleteCategory(cat._id);
        setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: false } : c)));
      } else {
        const updated = await adminApi.updateCategory(cat._id, { isActive: true });
        setCategories((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-white/60">
        Creator content categories — shown on signup, Explore Creators filters, and profile pages.
      </p>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-navy-800/50 p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/60">Category name</span>
          <input
            required
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Personal Finance"
            className="w-56 rounded-xl border border-white/10 bg-navy-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-orange-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/60">Icon name (lucide-react, optional)</span>
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="e.g. Wallet"
            className="w-48 rounded-xl border border-white/10 bg-navy-800/70 px-3.5 py-2.5 text-sm text-white outline-none focus:border-orange-400"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Category
        </button>
      </form>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading categories...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl border p-4',
                cat.isActive ? 'border-white/10 bg-navy-800/60' : 'border-white/5 bg-navy-800/30 opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                  <Tag size={15} />
                </span>
                <div>
                  <p className="font-semibold text-white">{cat.label}</p>
                  <p className="text-xs text-white/40">{cat.isActive ? 'Active' : 'Removed'}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleActive(cat)}
                disabled={actingOn === cat._id}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50',
                  cat.isActive ? 'border-red-500/40 text-red-300' : 'border-emerald-500/40 text-emerald-300'
                )}
              >
                {actingOn === cat._id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : cat.isActive ? (
                  <Trash2 size={12} />
                ) : (
                  <RotateCcw size={12} />
                )}
                {cat.isActive ? 'Remove' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}