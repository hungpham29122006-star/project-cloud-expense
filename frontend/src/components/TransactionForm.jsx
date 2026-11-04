import { useEffect, useState } from 'react';
import { today } from '../utils/format.js';

const empty = { type: 'EXPENSE', amount: '', categoryId: '', transactionDate: today(), note: '' };

// Dùng chung cho thêm mới (initial = null) và sửa (initial = giao dịch cần sửa)
export default function TransactionForm({ initial, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Nhấn Esc để đóng form
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const visibleCategories = categories.filter((c) => c.type === form.type);

  const validate = () => {
    const e = {};
    if (!(Number(form.amount) > 0)) e.amount = 'Nhập số tiền lớn hơn 0.';
    if (!form.categoryId) e.categoryId = 'Chọn một danh mục.';
    if (!form.transactionDate) e.transactionDate = 'Chọn ngày giao dịch.';
    if (form.note.length > 255) e.note = 'Ghi chú tối đa 255 ký tự.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      await onSubmit({
        type: form.type,
        amount: Number(form.amount),
        categoryId: Number(form.categoryId),
        transactionDate: form.transactionDate,
        note: form.note.trim(),
      });
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <h2>{initial ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>

        <div className="segmented full" role="group" aria-label="Loại giao dịch">
          <button type="button" className={form.type === 'EXPENSE' ? 'active expense' : ''}
            onClick={() => setForm({ ...form, type: 'EXPENSE', categoryId: '' })}>Khoản chi</button>
          <button type="button" className={form.type === 'INCOME' ? 'active income' : ''}
            onClick={() => setForm({ ...form, type: 'INCOME', categoryId: '' })}>Khoản thu</button>
        </div>

        <label className="field">
          Số tiền (VNĐ)
          <input type="number" min="1" step="1000" inputMode="numeric" autoFocus
            value={form.amount} onChange={set('amount')} placeholder="Ví dụ: 45000" />
          {errors.amount && <span className="error-text">{errors.amount}</span>}
        </label>

        <label className="field">
          Danh mục
          <select value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Chọn danh mục</option>
            {visibleCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
        </label>

        <label className="field">
          Ngày
          <input type="date" value={form.transactionDate} onChange={set('transactionDate')} />
          {errors.transactionDate && <span className="error-text">{errors.transactionDate}</span>}
        </label>

        <label className="field">
          Ghi chú
          <input type="text" value={form.note} onChange={set('note')} placeholder="Không bắt buộc" />
          {errors.note && <span className="error-text">{errors.note}</span>}
        </label>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : initial ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </button>
        </div>
      </form>
    </div>
  );
}
