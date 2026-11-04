import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/format.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/transactions" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Nhập họ tên.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Email không đúng định dạng.';
    if (form.password.length < 6) e.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError('');
    setLoading(true);
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
      navigate('/transactions', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', autoComplete) => (
    <label className="field">
      {label}
      <input type={type} autoComplete={autoComplete} value={form[key]} onChange={set(key)} />
      {errors[key] && <span className="error-text">{errors[key]}</span>}
    </label>
  );

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Tạo tài khoản</h1>
        {field('fullName', 'Họ tên', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Mật khẩu', 'password', 'new-password')}
        {field('confirm', 'Nhập lại mật khẩu', 'password', 'new-password')}

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
        <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </form>
    </div>
  );
}
