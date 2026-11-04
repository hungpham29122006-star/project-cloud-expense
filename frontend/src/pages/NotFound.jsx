import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state empty">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại hoặc đã bị đổi.</p>
      <Link className="btn btn-primary" to="/transactions">Về trang giao dịch</Link>
    </div>
  );
}
