import { create } from "zustand";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem("token") || null,
  user: null,
  balance: 0,
  transactions: [],
  loading: false,

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      set({ token });
      await get().fetchUserData();
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password, pin) => {
    await axios.post(`${API_BASE}/auth/register`, {
      email,
      password,
      pin,
    });
  },

  fetchUserData: async () => {
    try {
      const [meRes, txRes] = await Promise.all([
        axios.get(`${API_BASE}/wallet/me`),
        axios.get(`${API_BASE}/wallet/transactions`),
      ]);

      const me = meRes.data;

      set({
        user: {
          userId: me.userId,
          email: me.email,
          walletId: me.walletId,
          rewardPoints: me.rewardPoints ,
        },
        balance: me.balance || 0,
        transactions: txRes.data.transactions || [],
      });
    } catch (err) {
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  transfer: async (receiverWalletId, amount, pin) => {
    const idempotencyKey = crypto.randomUUID();

      const res = await axios.post(`${API_BASE}/wallet/transfer`, {
      receiverWalletId,
      amount: Number(amount),
      pin,
      idempotencyKey,
    });

    await get().fetchUserData();
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];

    set({
      token: null,
      user: null,
      balance: 0,
      transactions: [],
    });
  },
}));

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  useAuthStore.getState().fetchUserData();
}
