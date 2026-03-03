import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch } from '@/store';
import { apiSlice } from '@/store/apiSlice';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading, login } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      dispatch(apiSlice.util.invalidateTags(['Posts', 'Post', 'Courses', 'Course']));
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <span className="inline-block h-8 w-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding — ẩn trên mobile nhỏ, hiện từ sm */}
      <div className="hidden sm:flex sm:flex-1 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
        <div className="absolute inset-0 bg-hero-pattern opacity-60" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-10 lg:px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="text-accent-400">中文</span> Center
            </h1>
            <p className="mt-4 text-primary-200 text-lg">
              Đăng nhập để truy cập khóa học, bài test và theo dõi tiến độ học tập của bạn.
            </p>
            <div className="mt-10 flex items-center gap-3 text-primary-300">
              <div className="h-px flex-1 bg-primary-600" />
              <span className="text-sm">Học tiếng Trung mỗi ngày</span>
              <div className="h-px flex-1 bg-primary-600" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 bg-primary-50/80">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-accent-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          <div className="rounded-2xl bg-white p-8 shadow-card-hover border border-primary-100">
            <div className="sm:hidden mb-6">
              <h1 className="font-display text-2xl font-bold text-primary-900">
                <span className="text-accent-600">中文</span> Center
              </h1>
              <p className="text-primary-500 text-sm mt-1">Đăng nhập tài khoản</p>
            </div>
            <h2 className="hidden sm:block text-2xl font-bold text-primary-900">Đăng nhập</h2>
            <p className="hidden sm:block mt-1 text-primary-500 text-sm">Nhập email và mật khẩu để tiếp tục</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3"
                >
                  {error}
                </motion.p>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border bg-primary-50/50 text-primary-900 placeholder:text-primary-400',
                      'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:bg-white',
                      'border-primary-200 transition-colors',
                    )}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      'w-full pl-10 pr-12 py-3 rounded-xl border bg-primary-50/50 text-primary-900 placeholder:text-primary-400',
                      'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:bg-white',
                      'border-primary-200 transition-colors',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-100"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-accent-400 to-accent-600 text-primary-900 font-semibold shadow-glow/50 hover:shadow-glow hover:from-accent-500 hover:to-accent-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
