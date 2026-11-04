import axios from 'axios';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const TOKEN_KEY = 'expense_token';

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  timeout: 10000,
});

// Tự gắn JWT vào mọi request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token hết hạn hoặc sai -> xóa token, quay về trang đăng nhập
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('expense_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
