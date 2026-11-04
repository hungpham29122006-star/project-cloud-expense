import { useCallback, useEffect, useState } from 'react';
import api from '../api/index.js';
import FilterBar from '../components/FilterBar.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import { formatMoney, getErrorMessage } from '../utils/format.js';

const emptyFilters = { type: '', categoryId: '', from: '', to: '' };

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined: đóng, null: thêm mới, object: sửa

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api.getTransactions(filters));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    api.getCategories().then(setCategories).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await api.updateTransaction(editing.id, data);
        showToast('Đã lưu thay đổi.');
      } else {
        await api.createTransaction(data);
        showToast('Đã thêm giao dịch.');
      }
      setEditing(undefined);
      loadData();
    } catch (err) {
      throw new Error(getErrorMessage(err)); // để form hiển thị lỗi
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Xóa giao dịch "${tx.note || tx.categoryName}"? Thao tác này không hoàn tác được.`)) return;
    try {
      await api.deleteTransaction(tx.id);
      showToast('Đã xóa giao dịch.');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const income = items.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Giao dịch</h1>
          <p className="muted">
            {items.length} giao dịch{hasFilter ? ' khớp bộ lọc' : ''}: thu {formatMoney(income)}, chi {formatMoney(expense)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>Thêm giao dịch</button>
      </div>

      <FilterBar filters={filters} categories={categories} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="state">Đang tải giao dịch...</p>
      ) : items.length === 0 ? (
        <div className="state empty">
          {hasFilter ? (
            <>
              <p>Không có giao dịch nào khớp bộ lọc.</p>
              <button className="btn btn-ghost" onClick={() => setFilters(emptyFilters)}>Xóa bộ lọc</button>
            </>
          ) : (
            <>
              <p>Chưa có giao dịch nào. Thêm khoản chi đầu tiên để bắt đầu theo dõi.</p>
              <button className="btn btn-primary" onClick={() => setEditing(null)}>Thêm giao dịch</button>
            </>
          )}
        </div>
      ) : (
        <TransactionTable items={items} onEdit={setEditing} onDelete={handleDelete} />
      )}

      {editing !== undefined && (
        <TransactionForm
          initial={editing}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(undefined)}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
