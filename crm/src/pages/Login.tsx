import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      requestAnimationFrame(() => navigate('/', { replace: true }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-crm-side p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-crm-accent text-white mb-4">
            <LayoutGrid size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Chinese Center CRM</h1>
          <p className="mt-2 text-slate-400 text-sm">Đăng nhập để quản lý nội dung</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="crm-card p-6 sm:p-8 shadow-cardHover"
        >
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="crm-input pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="crm-input pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="crm-btn-primary w-full py-2.5"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500 text-xs">
          Chỉ dành cho quản trị viên Chinese Center
        </p>
      </div>
    </div>
  );
}
