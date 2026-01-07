import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Create the store
export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,        // { email, walletId, userId }
  balance: null,
  transactions: [],
  loading: false,

  // Login
  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const token = res.data.token;

      // Save token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ token });

      // Fetch user data after successful login
      await get().fetchUserData();
    } catch (err) {
      console.error('Login failed:', err);
      throw err; // Let component handle toast/error
    } finally {
      set({ loading: false });
    }
  },

  // Register
  register: async (email, password, pin) => {
    set({ loading: true });
    try {
      await axios.post(`${API_BASE}/auth/register`, { email, password, pin });
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch wallet + transactions
  fetchUserData: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true });
    try {
      const [meRes, txRes] = await Promise.all([
        axios.get(`${API_BASE}/wallet/me`),
        axios.get(`${API_BASE}/wallet/transactions`),
      ]);

      const meData = meRes.data;

      set({
        user: {
          userId: meData.userId,
          email: meData.email,
          walletId: meData.walletId,
        },
        balance: meData.balance,
        transactions: txRes.data.transactions || [],
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      // Optionally clear state on auth failure
      if (err.response?.status === 401) {
        get().logout();
      }
    } finally {
      set({ loading: false });
    }
  },

  // Transfer money
  transfer: async (receiverWalletId, amount, pin) => {
    const idempotencyKey = crypto.randomUUID();

    try {
      const res = await axios.post(`${API_BASE}/wallet/transfer`, {
        receiverWalletId,
        amount: Number(amount),
        pin,
        idempotencyKey,
      });

      // Refresh data after successful transfer
      await get().fetchUserData();

      return res.data;
    } catch (err) {
      console.error('Transfer failed:', err);
      throw err;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({
      token: null,
      user: null,
      balance: null,
      transactions: [],
    });
  },
}));

// Auto-load data on app start if token exists
const storedToken = localStorage.getItem('token');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  useAuthStore.getState().fetchUserData();
}