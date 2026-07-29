import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Search, Ban, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, type AdminUser } from '@/services/adminApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

const ROLES = ['', 'fan', 'creator', 'brand', 'agency', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listUsers({ search: search || undefined, role: role || undefined, page, limit: 25 })
      .then((d) => {
        setUsers(d.users);
        setPages(d.pages);
        setTotal(d.total);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, page]);

  const handleToggleSuspend = async (u: AdminUser, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActingOn(u._id);
    try {
      if (u.isSuspended) {
        const updated = await adminApi.reinstateUser(u._id);
        setUsers((prev) => prev.map((x) => (x._id === u._id ? updated : x)));
      } else {
        const reason = window.prompt('Reason for suspension (optional):') || '';
        const updated = await adminApi.suspendUser(u._id, reason);
        setUsers((prev) => prev.map((x) => (x._id === u._id ? updated : x)));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Users</h1>
      <p className="mt-1 text-sm text-white/60">
        Every account on the platform — {total.toLocaleString('en-IN')} total. Click a row for full details.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-full border border-white/10 bg-navy-800/60 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="rounded-full border border-white/10 bg-navy-800/60 px-4 py-2.5 text-sm text-white focus:border-orange-400"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-[#141414]">
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All roles'}
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
          <p className="text-sm">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <p className="mt-16 text-center text-white/50">No users found.</p>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-800/60 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u._id} className="relative bg-navy-800/30 transition-colors hover:bg-navy-800/60">
                    <td className="px-4 py-3 font-semibold text-white">
                      <Link to={`/users/${u._id}`} className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-300">
                            {u.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {u.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      <Link to={`/users/${u._id}`} className="block">
                        {u.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-white/60">
                      <Link to={`/users/${u._id}`} className="block">
                        {u.role}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/users/${u._id}`} className="block">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', u.isSuspended ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300')}>
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleToggleSuspend(u, e)}
                        disabled={actingOn === u._id}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-50',
                          u.isSuspended ? 'border border-emerald-500/40 text-emerald-300' : 'border border-red-500/40 text-red-300'
                        )}
                      >
                        {actingOn === u._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : u.isSuspended ? (
                          <RotateCcw size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                        {u.isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </td>
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