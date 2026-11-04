// Backend giả lưu trong localStorage, dùng khi VITE_USE_MOCK=true.
// Cấu trúc dữ liệu giống hệt API contract, nên khi có backend thật chỉ cần tắt mock.
const DB_KEY = 'expense_mock_db';
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const fail = (status, error) => Promise.reject({ response: { status, data: { error } } });

const CATEGORIES = [
  { id: 1, name: 'Ăn uống', type: 'EXPENSE' },
  { id: 2, name: 'Đi lại', type: 'EXPENSE' },
  { id: 3, name: 'Học tập', type: 'EXPENSE' },
  { id: 4, name: 'Giải trí', type: 'EXPENSE' },
  { id: 5, name: 'Nhà ở', type: 'EXPENSE' },
  { id: 6, name: 'Lương', type: 'INCOME' },
  { id: 7, name: 'Làm thêm', type: 'INCOME' },
  { id: 8, name: 'Gia đình gửi', type: 'INCOME' },
];

function seed() {
  // Dữ liệu mẫu nằm trong tháng hiện tại và tháng trước, để trang Tổng quan luôn có số liệu
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const thisMonth = (day) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(Math.min(day, now.getDate()))}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = (day) => `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-${pad(day)}`;
  let id = 1;
  const t = (type, amount, categoryId, transactionDate, note) => ({
    id: id++, userId: 1, type, amount, categoryId, transactionDate, note,
  });
  const transactions = [
    t('INCOME', 3000000, 8, lastMonth(1), 'Tiền tháng'),
    t('EXPENSE', 1800000, 5, lastMonth(2), 'Tiền phòng'),
    t('INCOME', 1500000, 7, lastMonth(15), 'Gia sư'),
    t('EXPENSE', 250000, 3, lastMonth(10), 'Mua giáo trình'),
    t('EXPENSE', 120000, 2, lastMonth(18), 'Đổ xăng'),
    t('EXPENSE', 90000, 4, lastMonth(25), 'Xem phim'),
    t('INCOME', 3000000, 8, thisMonth(1), 'Tiền tháng'),
    t('EXPENSE', 1800000, 5, thisMonth(1), 'Tiền phòng'),
    t('EXPENSE', 45000, 1, thisMonth(2), 'Cơm trưa'),
    t('EXPENSE', 30000, 1, thisMonth(3), 'Cà phê'),
    t('EXPENSE', 100000, 2, thisMonth(3), 'Đổ xăng'),
    t('EXPENSE', 55000, 1, thisMonth(4), 'Bún chả'),
    t('EXPENSE', 150000, 3, thisMonth(4), 'Photo tài liệu'),
  ];
  return {
    users: [{ id: 1, email: 'demo@example.com', fullName: 'Tài khoản demo', password: 'demo123' }],
    transactions,
    nextUserId: 2,
    nextTxId: id,
  };
}

const load = () => JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seed();
const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));
const currentUserId = () => Number((localStorage.getItem('expense_token') || '').replace('mock-token-', ''));
const withCategory = (tx) => ({ ...tx, categoryName: CATEGORIES.find((c) => c.id === tx.categoryId)?.name || '' });

function validateTx(body) {
  if (!['INCOME', 'EXPENSE'].includes(body.type)) return 'Loại giao dịch không hợp lệ.';
  if (!(Number(body.amount) > 0)) return 'Số tiền phải lớn hơn 0.';
  if (!body.transactionDate) return 'Vui lòng chọn ngày.';
  if (!CATEGORIES.some((c) => c.id === Number(body.categoryId))) return 'Danh mục không tồn tại.';
  return null;
}

export const mockApi = {
  async login({ email, password }) {
    await delay();
    const user = load().users.find((u) => u.email === email && u.password === password);
    if (!user) return fail(401, 'Email hoặc mật khẩu không đúng.');
    return { token: `mock-token-${user.id}`, user: { id: user.id, email: user.email, fullName: user.fullName } };
  },

  async register({ email, fullName, password }) {
    await delay();
    const db = load();
    if (db.users.some((u) => u.email === email)) return fail(409, 'Email này đã được đăng ký.');
    const user = { id: db.nextUserId++, email, fullName, password };
    db.users.push(user);
    save(db);
    return { token: `mock-token-${user.id}`, user: { id: user.id, email, fullName } };
  },

  async getCategories() {
    await delay(100);
    return CATEGORIES;
  },

  async getTransactions({ type, categoryId, from, to } = {}) {
    await delay();
    return load().transactions
      .filter((tx) => tx.userId === currentUserId())
      .filter((tx) => !type || tx.type === type)
      .filter((tx) => !categoryId || tx.categoryId === Number(categoryId))
      .filter((tx) => !from || tx.transactionDate >= from)
      .filter((tx) => !to || tx.transactionDate <= to)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id)
      .map(withCategory);
  },

  async createTransaction(body) {
    await delay();
    const error = validateTx(body);
    if (error) return fail(400, error);
    const db = load();
    const tx = { ...body, id: db.nextTxId++, userId: currentUserId(), amount: Number(body.amount), categoryId: Number(body.categoryId) };
    db.transactions.push(tx);
    save(db);
    return withCategory(tx);
  },

  async updateTransaction(id, body) {
    await delay();
    const error = validateTx(body);
    if (error) return fail(400, error);
    const db = load();
    const idx = db.transactions.findIndex((tx) => tx.id === id && tx.userId === currentUserId());
    if (idx === -1) return fail(404, 'Không tìm thấy giao dịch.');
    db.transactions[idx] = { ...db.transactions[idx], ...body, amount: Number(body.amount), categoryId: Number(body.categoryId) };
    save(db);
    return withCategory(db.transactions[idx]);
  },

  async deleteTransaction(id) {
    await delay();
    const db = load();
    const before = db.transactions.length;
    db.transactions = db.transactions.filter((tx) => !(tx.id === id && tx.userId === currentUserId()));
    if (db.transactions.length === before) return fail(404, 'Không tìm thấy giao dịch.');
    save(db);
  },

  async getMonthlyStats(month) {
    const list = await this.getTransactions({ from: `${month}-01`, to: `${month}-31` });
    const income = list.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const map = {};
    list.filter((t) => t.type === 'EXPENSE').forEach((t) => { map[t.categoryName] = (map[t.categoryName] || 0) + t.amount; });
    const byCategory = Object.entries(map).map(([categoryName, total]) => ({ categoryName, total })).sort((a, b) => b.total - a.total);
    return { income, expense, balance: income - expense, byCategory };
  },
};
