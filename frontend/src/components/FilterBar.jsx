export default function FilterBar({ filters, categories, onChange, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const visibleCategories = categories.filter((c) => !filters.type || c.type === filters.type);

  return (
    <div className="filter-bar">
      <div className="segmented" role="group" aria-label="Lọc theo loại">
        {[['', 'Tất cả'], ['EXPENSE', 'Khoản chi'], ['INCOME', 'Khoản thu']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filters.type === value ? 'active' : ''}
            onClick={() => onChange({ ...filters, type: value, categoryId: '' })}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="field-inline">
        Danh mục
        <select value={filters.categoryId} onChange={set('categoryId')}>
          <option value="">Tất cả</option>
          {visibleCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field-inline">
        Từ ngày
        <input type="date" value={filters.from} onChange={set('from')} />
      </label>
      <label className="field-inline">
        Đến ngày
        <input type="date" value={filters.to} onChange={set('to')} />
      </label>
      <button type="button" className="btn btn-ghost" onClick={onReset}>Xóa bộ lọc</button>
    </div>
  );
}
