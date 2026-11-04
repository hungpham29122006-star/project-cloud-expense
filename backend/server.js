const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const os = require('os');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'expense',
  password: process.env.DB_PASSWORD || 'expense',
  database: process.env.DB_NAME || 'expense',
});
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const VERSION = process.env.APP_VERSION || 'dev';
const PORT = Number(process.env.PORT || 8080);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// CORS (chỉ cần khi frontend dev chạy cổng 5173 gọi thẳng backend 8080)
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
  UNIQUE (name, type));
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id),
  type TEXT NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
  amount NUMERIC(14,0) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, transaction_date);
INSERT INTO categories (name, type) VALUES
  ('Ăn uống','EXPENSE'),('Di chuyển','EXPENSE'),('Nhà ở','EXPENSE'),('Mua sắm','EXPENSE'),
  ('Giải trí','EXPENSE'),('Sức khoẻ','EXPENSE'),('Giáo dục','EXPENSE'),('Khác','EXPENSE'),
  ('Lương','INCOME'),('Thưởng','INCOME'),('Đầu tư','INCOME'),('Khác','INCOME')
ON CONFLICT (name, type) DO NOTHING;`;

// Nhiều replica khởi động cùng lúc -> dùng advisory lock để chỉ 1 bên tạo bảng tại một thời điểm
async function init() {
  for (let i = 0; i < 60; i++) {
    let client;
    try {
      client = await pool.connect();
      await client.query('SELECT pg_advisory_lock(727)');
      await client.query(SCHEMA);
      await client.query('SELECT pg_advisory_unlock(727)');
      client.release();
      console.log('DB ready');
      return;
    } catch (e) {
      console.log('Waiting for DB...', e.message);
      if (client) client.release(true);
      await sleep(2000);
    }
  }
}

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

function auth(req, res, next) {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    next();
  } catch { bad(res, 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 401); }
}
const makeAuth = (u) => ({
  token: jwt.sign({ id: u.id }, SECRET, { expiresIn: '8h' }),
  user: { id: u.id, email: u.email, fullName: u.full_name },
});

// ---------- health / info ----------
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.get('/api/ready', wrap(async (_, res) => { await pool.query('SELECT 1'); res.json({ ok: true }); }));
app.get('/api/info', (_, res) => res.json({ version: VERSION, pod: os.hostname() }));

// ---------- auth ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { fullName, email, password } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(mail)) return bad(res, 'Họ tên hoặc email không hợp lệ');
  if (!password || String(password).length < 6) return bad(res, 'Mật khẩu tối thiểu 6 ký tự');
  try {
    const hash = await bcrypt.hash(String(password), 8);
    const r = await pool.query(
      'INSERT INTO users (email, full_name, password_hash) VALUES ($1,$2,$3) RETURNING *',
      [mail, String(fullName).trim(), hash]);
    res.status(201).json(makeAuth(r.rows[0]));
  } catch (e) {
    if (e.code === '23505') return bad(res, 'Email đã được sử dụng', 409);
    throw e;
  }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const r = await pool.query('SELECT * FROM users WHERE email=$1', [String(email || '').trim().toLowerCase()]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(String(password || ''), u.password_hash)))
    return bad(res, 'Sai email hoặc mật khẩu', 401);
  res.json(makeAuth(u));
}));

// ---------- categories ----------
app.get('/api/categories', auth, wrap(async (_, res) => {
  res.json((await pool.query('SELECT id, name, type FROM categories ORDER BY type DESC, id')).rows);
}));

// ---------- transactions ----------
const TX = `SELECT t.id, t.type, t.amount::float8 AS amount, t.category_id AS "categoryId",
  c.name AS "categoryName", to_char(t.transaction_date,'YYYY-MM-DD') AS "transactionDate", t.note
  FROM transactions t JOIN categories c ON c.id = t.category_id`;
const getTx = async (id, uid) => (await pool.query(`${TX} WHERE t.id=$1 AND t.user_id=$2`, [id, uid])).rows[0];

app.get('/api/transactions', auth, wrap(async (req, res) => {
  const { type, categoryId, from, to } = req.query;
  const where = ['t.user_id=$1'], args = [req.user.id];
  const add = (cond, v) => { args.push(v); where.push(cond.replace('?', '$' + args.length)); };
  if (type) add('t.type=?', type);
  if (categoryId) add('t.category_id=?', Number(categoryId));
  if (from) add('t.transaction_date>=?', from);
  if (to) add('t.transaction_date<=?', to);
  const r = await pool.query(`${TX} WHERE ${where.join(' AND ')} ORDER BY t.transaction_date DESC, t.id DESC`, args);
  res.json(r.rows);
}));

async function parseTx(b) {
  const type = b.type, amount = Math.round(Number(b.amount)), categoryId = Number(b.categoryId);
  const date = b.transactionDate;
  if (!['INCOME', 'EXPENSE'].includes(type)) return { error: 'Loại giao dịch không hợp lệ' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Số tiền phải lớn hơn 0' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || isNaN(new Date(date))) return { error: 'Ngày không hợp lệ (YYYY-MM-DD)' };
  const c = await pool.query('SELECT 1 FROM categories WHERE id=$1 AND type=$2', [categoryId, type]);
  if (!c.rowCount) return { error: 'Danh mục không hợp lệ hoặc không khớp loại giao dịch' };
  return { v: [type, amount, categoryId, date, String(b.note || '').slice(0, 500)] };
}

app.post('/api/transactions', auth, wrap(async (req, res) => {
  const p = await parseTx(req.body || {});
  if (p.error) return bad(res, p.error);
  const r = await pool.query(
    `INSERT INTO transactions (user_id, type, amount, category_id, transaction_date, note)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [req.user.id, ...p.v]);
  res.status(201).json(await getTx(r.rows[0].id, req.user.id));
}));

app.put('/api/transactions/:id', auth, wrap(async (req, res) => {
  const p = await parseTx(req.body || {});
  if (p.error) return bad(res, p.error);
  const r = await pool.query(
    `UPDATE transactions SET type=$3, amount=$4, category_id=$5, transaction_date=$6, note=$7
     WHERE id=$1 AND user_id=$2 RETURNING id`, [Number(req.params.id), req.user.id, ...p.v]);
  if (!r.rowCount) return bad(res, 'Không tìm thấy giao dịch', 404);
  res.json(await getTx(r.rows[0].id, req.user.id));
}));

app.delete('/api/transactions/:id', auth, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2', [Number(req.params.id), req.user.id]);
  if (!r.rowCount) return bad(res, 'Không tìm thấy giao dịch', 404);
  res.sendStatus(204);
}));

// ---------- stats ----------
app.get('/api/stats/monthly', auth, wrap(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return bad(res, 'month phải có dạng YYYY-MM');
  const start = month + '-01';
  const range = `t.user_id=$1 AND t.transaction_date >= $2::date AND t.transaction_date < ($2::date + interval '1 month')`;
  const sums = await pool.query(
    `SELECT t.type, COALESCE(SUM(t.amount),0)::float8 AS total FROM transactions t WHERE ${range} GROUP BY t.type`,
    [req.user.id, start]);
  const by = await pool.query(
    `SELECT c.name AS "categoryName", SUM(t.amount)::float8 AS total FROM transactions t
     JOIN categories c ON c.id=t.category_id WHERE ${range} AND t.type='EXPENSE'
     GROUP BY c.name ORDER BY total DESC`, [req.user.id, start]);
  const get = (k) => (sums.rows.find((r) => r.type === k) || { total: 0 }).total;
  const income = get('INCOME'), expense = get('EXPENSE');
  res.json({ income, expense, balance: income - expense, byCategory: by.rows });
}));

// ---------- lỗi ----------
app.use((req, res) => bad(res, 'Không tìm thấy', 404));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return bad(res, 'JSON không hợp lệ');
  console.error(err);
  bad(res, 'Lỗi máy chủ', 500);
});

init().then(() => app.listen(PORT, () => console.log(`Expense API ${VERSION} on :${PORT}`)));
