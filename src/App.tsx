import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, setHydrated } from '@/store/slices/authSlice';
import { authApi } from '@/services/authApi';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminVerifications from '@/pages/AdminVerifications';
import AdminAgencies from '@/pages/AdminAgencies';
import AdminReferralConfig from '@/pages/AdminReferralConfig';

function useAuthHydration() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (accessToken) {
        try {
          const user = await authApi.getMe();
          if (!cancelled) dispatch(setCredentials({ user, accessToken }));
        } catch {
          // token invalid/expired — interceptor already logs out on 401
        }
      }
      if (!cancelled) dispatch(setHydrated());
    }
    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  useAuthHydration();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/" element={<Shell><PageTransition><AdminDashboard /></PageTransition></Shell>} />
        <Route path="/users" element={<Shell><PageTransition><AdminUsers /></PageTransition></Shell>} />
        <Route path="/verifications" element={<Shell><PageTransition><AdminVerifications /></PageTransition></Shell>} />
        <Route path="/agencies" element={<Shell><PageTransition><AdminAgencies /></PageTransition></Shell>} />
        <Route path="/referral-config" element={<Shell><PageTransition><AdminReferralConfig /></PageTransition></Shell>} />
      </Routes>
    </AnimatePresence>
  );
}