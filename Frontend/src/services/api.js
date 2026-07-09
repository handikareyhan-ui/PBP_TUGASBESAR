import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically append the JWT token from localStorage to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bc_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // ----------------------------------------------------
  // AUTH SERVICES
  // ----------------------------------------------------
  loginAdmin: async (username, password) => {
    const response = await apiClient.post('/auth/admin/login', { username, password });
    if (response.data && response.data.success) {
      localStorage.setItem('bc_auth_token', response.data.token);
      localStorage.setItem('bc_role', response.data.role);
    }
    return response.data;
  },

  loginUser: async (nikOrWallet, method) => {
    const response = await apiClient.post('/auth/user/login', { identifier: nikOrWallet, method });
    if (response.data && response.data.success) {
      localStorage.setItem('bc_auth_token', response.data.token);
      localStorage.setItem('bc_role', response.data.role);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('bc_auth_token');
    localStorage.removeItem('bc_role');
  },

  getRole: () => {
    return localStorage.getItem('bc_role');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('bc_auth_token');
  },

  getUserProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // ----------------------------------------------------
  // ADMIN: RECIPIENT MANAGEMENT
  // ----------------------------------------------------
  getRecipients: async () => {
    const response = await apiClient.get('/recipients');
    return response.data;
  },

  getRecipientById: async (id) => {
    const response = await apiClient.get(`/recipients/${id}`);
    return response.data;
  },

  addRecipient: async (recipient) => {
    const response = await apiClient.post('/recipients', recipient);
    return response.data;
  },

  deleteRecipient: async (id) => {
    const response = await apiClient.delete(`/recipients/${id}`);
    return response.data;
  },

  updateRecipientStatus: async (id, status) => {
    const response = await apiClient.patch(`/recipients/${id}/status`, { status });
    return response.data;
  },

  // ----------------------------------------------------
  // ADMIN: ZKP QUEUE VALIDATION
  // ----------------------------------------------------
  getZKPQueue: async () => {
    const response = await apiClient.get('/zkp/queue');
    return response.data;
  },

  verifyZKPApplicant: async (id) => {
    const response = await apiClient.post(`/zkp/verify/${id}`);
    return response.data;
  },

  // ----------------------------------------------------
  // ADMIN: DISBURSEMENT / DISTRIBUSI
  // ----------------------------------------------------
  distributeAll: async () => {
    const response = await apiClient.post('/disbursement/distribute-all');
    return response.data;
  },

  getDistributions: async () => {
    const response = await apiClient.get('/distributions');
    return response.data;
  },

  getVerifications: async () => {
    const response = await apiClient.get('/verifications');
    return response.data;
  },

  // ----------------------------------------------------
  // AUDIT TRAIL / MONITORS
  // ----------------------------------------------------
  getTransactions: async () => {
    const response = await apiClient.get('/transactions');
    return response.data;
  },

  getTelemetry: async () => {
    const response = await apiClient.get('/telemetry');
    return response.data;
  },

  // ----------------------------------------------------
  // ADMIN: FUND / PROGRAM MANAGEMENT
  // ----------------------------------------------------
  getFunds: async () => {
    const response = await apiClient.get('/funds');
    return response.data;
  },

  getFundById: async (id) => {
    const response = await apiClient.get(`/funds/${id}`);
    return response.data;
  },

  createFund: async (fundData) => {
    const response = await apiClient.post('/funds', fundData);
    return response.data;
  },

  updateFund: async (id, fundData) => {
    const response = await apiClient.put(`/funds/${id}`, fundData);
    return response.data;
  },

  deleteFund: async (id) => {
    const response = await apiClient.delete(`/funds/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/funds/dashboard-stats');
    return response.data;
  },

  // ----------------------------------------------------
  // USER PORTAL SERVICES
  // ----------------------------------------------------
  getClaimStep: async () => {
    const response = await apiClient.get('/user/claim-step');
    return response.data.step;
  },

  setClaimStep: async (step) => {
    const response = await apiClient.post('/user/claim-step', { step });
    return response.data.step;
  },
};
