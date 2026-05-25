import axios from 'axios';

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 5000,
});

// Automatically inject JWT token from localStorage on requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vital30_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export async function getHealth() {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}

