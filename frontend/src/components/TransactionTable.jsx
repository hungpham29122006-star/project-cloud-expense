import { formatDate, formatMoney } from '../utils/format.js';

export default function TransactionTable({ items, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Danh mục</th>
            <th>Ghi chú</th>
            <th className="num">Số tiền</th>
            <th aria-label="Thao tác" />
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx.id}>
              <td>{formatDate(tx.transactionDate)}</td>
              <td>{tx.categoryName}</td>
              <td className="note">{tx.note || <span className="muted">Không có ghi chú</span>}</td>
              <td className={`num amount ${tx.type === 'INCOME' ? 'income' : 'expense'}`}>
                {tx.type === 'INCOME' ? '+' : '−'}{formatMoney(tx.amount)}
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => onEdit(tx)}>Sửa</button>
                <button className="btn btn-small btn-danger" onClick={() => onDelete(tx)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
