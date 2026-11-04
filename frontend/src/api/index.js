// Mọi trang chỉ import từ file này. Bật/tắt mock bằng VITE_USE_MOCK.
import client, { USE_MOCK } from './client.js';
import { mockApi } from './mock.js';

const realApi = {
  login: (body) => client.post('/auth/login', body).then((r) => r.data),
  register: (body) => client.post('/auth/register', body).then((r) => r.data),
  getCategories: () => client.get('/categories').then((r) => r.data),
  getTransactions: (filters = {}) => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    return client.get('/transactions', { params }).then((r) => r.data);
  },
  createTransaction: (body) => client.post('/transactions', body).then((r) => r.data),
  updateTransaction: (id, body) => client.put(`/transactions/${id}`, body).then((r) => r.data),
  deleteTransaction: (id) => client.delete(`/transactions/${id}`).then((r) => r.data),
  getMonthlyStats: (month) => client.get('/stats/monthly', { params: { month } }).then((r) => r.data),
};

const api = USE_MOCK ? mockApi : realApi;
export default api;
