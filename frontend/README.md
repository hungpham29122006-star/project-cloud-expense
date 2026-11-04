# Frontend – Ứng dụng quản lý chi tiêu cá nhân

React 18 + Vite + React Router + Axios. Không dùng thư viện UI, CSS nằm trong `src/index.css`.

## Chạy ở máy cá nhân

```bash
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # mở http://localhost:5173
```

Mặc định `VITE_USE_MOCK=true`: dữ liệu giả lưu trong trình duyệt, **không cần backend**.
Tài khoản demo: `demo@example.com` / `demo123`.

Khi backend đã chạy, sửa `.env`:

```
VITE_API_URL=http://localhost:8080
VITE_USE_MOCK=false
```

Lưu ý: biến `VITE_*` được gắn vào lúc build, đổi `.env` xong phải chạy lại `npm run dev` hoặc build lại.

## Cấu trúc thư mục

```
src/
├── api/
│   ├── client.js        # axios: baseURL từ VITE_API_URL, tự gắn JWT, xử lý 401
│   ├── mock.js          # backend giả (localStorage) cho giai đoạn chưa có API
│   └── index.js         # chọn api thật hoặc mock theo VITE_USE_MOCK
├── components/          # Navbar, ProtectedRoute, FilterBar, TransactionTable, TransactionForm
├── context/AuthContext.jsx   # trạng thái đăng nhập, login/register/logout
├── pages/               # Login, Register, Transactions, Dashboard, NotFound
├── utils/format.js      # định dạng tiền VNĐ, ngày dd/mm/yyyy, lấy thông báo lỗi
├── App.jsx              # khai báo route
└── index.css
```

## API contract mà frontend đang dùng (thống nhất với backend)

| Method | Endpoint | Gửi lên | Trả về |
|---|---|---|---|
| POST | /api/auth/register | `{ fullName, email, password }` | `{ token, user: { id, email, fullName } }` |
| POST | /api/auth/login | `{ email, password }` | `{ token, user }` |
| GET | /api/categories | | `[{ id, name, type }]` |
| GET | /api/transactions?type=&categoryId=&from=&to= | | `[{ id, type, amount, categoryId, categoryName, transactionDate, note }]` |
| POST | /api/transactions | `{ type, amount, categoryId, transactionDate, note }` | giao dịch vừa tạo |
| PUT | /api/transactions/:id | như POST | giao dịch sau khi sửa |
| DELETE | /api/transactions/:id | | 204 |
| GET | /api/stats/monthly?month=YYYY-MM | | `{ income, expense, balance, byCategory: [{ categoryName, total }] }` |

- `type` là `INCOME` hoặc `EXPENSE`; ngày dạng `YYYY-MM-DD`.
- Mọi request (trừ đăng nhập/đăng ký) gửi header `Authorization: Bearer <token>`.
- Lỗi trả về dạng `{ "error": "Thông báo cho người dùng" }` kèm mã 400/401/403/404/409.

## Build và Docker

```bash
npm run build             # kết quả nằm trong dist/

docker build -t ten-nhom/expense-frontend:v0.1 \
  --build-arg VITE_API_URL=https://api.ten-mien-cua-nhom.com .
docker run -p 3000:80 ten-nhom/expense-frontend:v0.1
```

Nếu nhóm chọn cho backend phục vụ luôn giao diện (một image duy nhất), chỉ cần `npm run build`
rồi copy thư mục `dist/` vào backend, đặt `VITE_API_URL` để trống.

## Việc còn lại cho các tuần sau

- Thay thanh ngang ở Tổng quan bằng biểu đồ (Recharts hoặc Chart.js)
- Phân trang danh sách giao dịch
- Trang quản lý danh mục riêng
- Kiểm tra lại giao diện trên điện thoại
