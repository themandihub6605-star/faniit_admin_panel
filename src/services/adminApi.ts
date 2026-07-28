import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiAgency } from '@/types/agency';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalCreators: number;
  totalBrands: number;
  totalSessions: number;
  totalCampaigns: number;
  totalRevenue: number;
  totalPlatformCommission: number;
  totalInEscrow: number;
  monthlyRevenue: { _id: { year: number; month: number }; total: number }[];
}

export interface PendingVerifications {
  pendingCreators: { _id: string; user: { name: string; email: string; avatarUrl?: string }; category?: { label: string }; bio?: string }[];
  pendingBrands: { _id: string; user: { name: string; email: string; avatarUrl?: string }; companyName: string; industry?: string }[];
}

/** Admin-only endpoints — Agency approval, plus core moderation/analytics. */
export const adminApi = {
  setAgencyPassword: (id: string, password: string) =>
    apiClient.patch<ApiEnvelope<{ email: string; password: string }>>(`/admin/agencies/${id}/set-password`, { password }).then((r) => r.data.data),

  listAgencies: (status?: 'pending' | 'verified' | 'rejected' | 'unverified') =>
    apiClient.get<ApiEnvelope<ApiAgency[]>>('/admin/agencies', { params: { status } }).then((r) => r.data.data),

  verifyAgency: (id: string, decision: 'verified' | 'rejected', rejectionReason?: string) =>
    apiClient.patch<ApiEnvelope<ApiAgency>>(`/admin/agencies/${id}/verify`, { decision, rejectionReason }).then((r) => r.data.data),

  getAnalytics: () => apiClient.get<ApiEnvelope<AdminAnalytics>>('/admin/analytics/overview').then((r) => r.data.data),

  listUsers: (params: { role?: string; search?: string; page?: number; limit?: number } = {}) =>
    apiClient
      .get<ApiEnvelope<{ users: AdminUser[]; total: number; page: number; pages: number }>>('/admin/users', { params })
      .then((r) => r.data.data),

  suspendUser: (id: string, reason?: string) =>
    apiClient.patch<ApiEnvelope<AdminUser>>(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data.data),

  reinstateUser: (id: string) => apiClient.patch<ApiEnvelope<AdminUser>>(`/admin/users/${id}/reinstate`).then((r) => r.data.data),

  listPendingVerifications: () =>
    apiClient.get<ApiEnvelope<PendingVerifications>>('/admin/verifications/pending').then((r) => r.data.data),

  verifyCreator: (id: string, decision: 'verified' | 'rejected') =>
    apiClient.patch(`/admin/verifications/creator/${id}`, { decision }).then((r) => r.data.data),

  verifyBrand: (id: string, decision: 'verified' | 'rejected') =>
    apiClient.patch(`/admin/verifications/brand/${id}`, { decision }).then((r) => r.data.data),
};