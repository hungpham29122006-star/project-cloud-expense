import { useEffect, useState } from 'react';
import api from '../api/index.js';
import { currentMonth, formatMoney, getErrorMessage } from '../utils/format.js';

// Bản khởi đầu: tổng thu, chi, số dư và chi tiêu theo danh mục dạng thanh ngang.
// Các tuần sau có thể thay bằng biểu đồ Recharts/Chart.js.
export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setStats(null);
    setError('');
    api.getMonthlyStats(month).then(setStats).catch((err) => setError(getErrorMessage(err)));
  }, [month]);

  const max = stats?.byCategory?.[0]?.total || 1;

  return (
    <section>
      <div className="page-head">
        <h1>Tổng quan tháng</h1>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Chọn tháng" />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!stats && !error && <p className="state">Đang tải số liệu...</p>}

      {stats && (
        <>
          <div className="balance">
            <span className="balance-label">Còn lại trong tháng</span>
            <span className={`balance-value ${stats.balance < 0 ? 'expense' : ''}`}>{formatMoney(stats.balance)}</span>
            <span className="balance-detail">
              Thu <strong className="income">{formatMoney(stats.income)}</strong> và chi{' '}
              <strong className="expense">{formatMoney(stats.expense)}</strong>
            </span>
          </div>

          <h2 className="section-title">Chi tiêu theo danh mục</h2>
          {stats.byCategory.length === 0 ? (
            <p className="state">Tháng này chưa có khoản chi nào.</p>
          ) : (
            <ul className="bars">
              {stats.byCategory.map((c) => (
                <li key={c.categoryName}>
                  <span className="bar-name">{c.categoryName}</span>
                  <span className="bar-track"><span className="bar-fill" style={{ width: `${(c.total / max) * 100}%` }} /></span>
                  <span className="bar-value">{formatMoney(c.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
