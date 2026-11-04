const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export const formatMoney = (value) => moneyFormatter.format(Number(value) || 0);

// "2026-11-04" -> "04/11/2026"
export const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const today = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => new Date().toISOString().slice(0, 7);

// Lấy thông báo lỗi dễ hiểu từ lỗi axios
export const getErrorMessage = (err) =>
  err?.response?.data?.error ||
  (err?.request && !err?.response ? 'Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.' : null) ||
  err?.message ||
  'Đã xảy ra lỗi không xác định.';
