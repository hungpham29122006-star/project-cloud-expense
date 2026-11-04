import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { USE_MOCK } from '../api/client.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">Sổ Chi Tiêu</NavLink>
        {user && (
          <nav className="nav-links">
            <NavLink to="/transactions">Giao dịch</NavLink>
            <NavLink to="/dashboard">Tổng quan</NavLink>
          </nav>
        )}
        <div className="nav-right">
          {USE_MOCK && <span className="mock-badge" title="Đang dùng dữ liệu giả, chưa nối backend">Dữ liệu giả</span>}
          {user && (
            <>
              <span className="user-name">{user.fullName || user.email}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Đăng xuất</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
