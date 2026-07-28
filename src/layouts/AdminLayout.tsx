import { type PropsWithChildren, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users2, ShieldCheck, Building2, Percent, LogOut, Menu } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users2 },
  { href: '/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/agencies', label: 'Agencies', icon: Building2 },
  { href: '/referral-config', label: 'Referral Commission', icon: Percent },
];

export function AdminLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy-800/40 px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 px-2">
          <Logo className="h-8 w-auto" />
        </Link>
        <p className="mb-4 px-2 text-xs font-bold uppercase tracking-wide text-white/30">Admin Panel</p>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  active ? 'bg-orange-500/15 text-orange-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon size={17} /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-white/40">Admin</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/90 px-4 backdrop-blur-xl lg:hidden">
          <Link to="/">
            <Logo className="h-7 w-auto" />
          </Link>
          <button onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Toggle menu">
            <Menu size={20} />
          </button>
        </header>

        {mobileOpen && (
          <div className="border-b border-white/10 bg-navy-800/60 px-4 py-3 lg:hidden">
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold', active ? 'bg-orange-500/15 text-orange-300' : 'text-white/70')}
                  >
                    <item.icon size={17} /> {item.label}
                  </Link>
                );
              })}
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-300">
                <LogOut size={17} /> Log out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 px-4 pb-16 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}