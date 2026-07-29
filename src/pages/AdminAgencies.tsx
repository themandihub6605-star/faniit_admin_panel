import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Check, X, Building2, MapPin, Phone, KeyRound, Copy, CheckCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { adminApi } from '@/services/adminApi';
import type { ApiAgency } from '@/types/agency';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass + '!';
}

export default function AdminAgencyApprovals() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pending');
  const [agencies, setAgencies] = useState<ApiAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [passwordFormFor, setPasswordFormFor] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [issuedCredentials, setIssuedCredentials] = useState<{ id: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listAgencies(tab)
      .then(setAgencies)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleDecision = async (id: string, decision: 'verified' | 'rejected') => {
    setActingOn(id);
    try {
      await adminApi.verifyAgency(id, decision);
      setAgencies((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  const openPasswordForm = (agencyId: string) => {
    setIssuedCredentials(null);
    setPasswordInput(generatePassword());
    setPasswordFormFor(agencyId);
  };

  const handleSetPassword = async (agency: ApiAgency) => {
    if (passwordInput.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setActingOn(agency._id);
    setError('');
    try {
      const result = await adminApi.setAgencyPassword(agency._id, passwordInput);
      setIssuedCredentials({ id: agency._id, email: result.email, password: result.password });
      setPasswordFormFor(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}\nLogin at: [your Agency Panel URL]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-8 pb-16">
      <Container>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Agency Approval</h1>
        <p className="mt-1 text-sm text-white/60">
          Review agency registration requests. Once approved, set a login password so they can access the separate Agency Panel.
        </p>

        <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-navy-800/50 p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.key ? 'bg-orange-500/15 text-orange-300' : 'text-white/50 hover:text-white/80'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading agencies...</p>
          </div>
        )}

        {!loading && agencies.length === 0 && (
          <p className="mt-16 text-center text-white/50">No {tab} agencies right now.</p>
        )}

        {!loading && agencies.length > 0 && (
          <div className="mt-6 space-y-3">
            {agencies.map((agency) => (
              <div key={agency._id} className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <p className="font-bold text-white">{agency.agencyName}</p>
                      <p className="text-sm text-white/50">Owner: {agency.ownerName || agency.user?.name || 'Unknown'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                        {agency.user?.email && <span>{agency.user.email}</span>}
                        {agency.mobile && (
                          <span className="flex items-center gap-1"><Phone size={11} /> {agency.mobile}</span>
                        )}
                        {agency.city && (
                          <span className="flex items-center gap-1"><MapPin size={11} /> {agency.city}{agency.state ? `, ${agency.state}` : ''}</span>
                        )}
                        {agency.documentUrl && (
                          <a href={agency.documentUrl} target="_blank" rel="noreferrer" className="text-sky-400 underline hover:text-sky-300">
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {tab === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(agency._id, 'verified')}
                        disabled={actingOn === agency._id}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {actingOn === agency._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                      </button>
                      <button
                        onClick={() => handleDecision(agency._id, 'rejected')}
                        disabled={actingOn === agency._id}
                        className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}

                  {tab === 'verified' && passwordFormFor !== agency._id && issuedCredentials?.id !== agency._id && (
                    <button
                      onClick={() => openPasswordForm(agency._id)}
                      className="flex items-center gap-1.5 rounded-full border border-orange-400/40 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/10"
                    >
                      <KeyRound size={14} /> Set Agency Panel Password
                    </button>
                  )}
                </div>

                {tab === 'verified' && passwordFormFor === agency._id && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-navy-800/50 p-3">
                    <input
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="flex-1 min-w-[160px] rounded-lg border border-white/10 bg-navy-900/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-orange-400"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordInput(generatePassword())}
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/5"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => handleSetPassword(agency)}
                      disabled={actingOn === agency._id}
                      className="rounded-lg bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {actingOn === agency._id ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                    </button>
                    <button onClick={() => setPasswordFormFor(null)} className="text-xs font-semibold text-white/40 hover:text-white/70">
                      Cancel
                    </button>
                  </div>
                )}

                {issuedCredentials?.id === agency._id && (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <p className="text-sm font-bold text-emerald-300">Password set — share these with the agency:</p>
                    <p className="mt-2 text-sm text-white/80">
                      Email: <span className="font-mono">{issuedCredentials.email}</span>
                    </p>
                    <p className="text-sm text-white/80">
                      Password: <span className="font-mono">{issuedCredentials.password}</span>
                    </p>
                    <button
                      onClick={() => copyCredentials(issuedCredentials.email, issuedCredentials.password)}
                      className="mt-3 flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/5"
                    >
                      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copied ? 'Copied' : 'Copy Credentials'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}