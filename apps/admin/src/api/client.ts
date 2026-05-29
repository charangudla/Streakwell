import axios from 'axios';

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

/**
 * Axios instance for the admin API.
 *
 * `withCredentials: true` so the Better Auth session cookie (set by the
 * API under the shared `.challenge.charangudla.com` domain in prod, and as a
 * cross-origin localhost cookie in dev) rides along on every request.
 * Admin endpoints under `/admin/*` are gated on an ADMIN/SUPER_ADMIN
 * session, so this cookie is what authorises them.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 8000,
  withCredentials: true,
});

export async function getHealth() {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}
