import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchModal from '@/components/search/SearchModal';
import { useAppDispatch, useAppSelector } from '@/store';
import { openSearch, closeSearch } from '@/store/uiSlice';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/khoa-hoc', label: 'Khóa học' },
  { to: '/doi-ngu-giao-vien', label: 'Đội ngũ giáo viên' },
  { to: '/ve-chung-toi', label: 'Về chúng tôi' },
  { to: '/tin-tuc', label: 'Tin tức' },
  { to: '/cau-hoi-thuong-gap', label: 'FAQ' },
  { to: '/lien-he', label: 'Liên hệ' },
];

const quickLinks = [
  { to: '/kiem-tra-trinh-do', label: 'Kiểm tra trình độ' },
  { to: '/dang-ky-hoc-thu', label: 'Đăng ký học thử' },
  { to: '/lich-hoc', label: 'Lịch học' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchOpen = useAppSelector((s) => s.ui.searchOpen);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-primary-200/80 bg-white/95 backdrop-blur-md">
        <nav className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
                <span className="text-accent-600 group-hover:text-accent-700 transition-colors">中文</span>
                <span className="text-primary-900"> Center</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    location.pathname === to
? 'text-accent-600 bg-accent-50'
                    : 'text-primary-600 hover:text-accent-600 hover:bg-primary-50',
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => dispatch(openSearch())}
                className="p-2.5 rounded-lg text-primary-600 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500 min-w-[44px] min-h-[44px] flex items-center justify-center lg:min-w-0 lg:min-h-0"
                aria-label="Tìm kiếm khóa học"
              >
                <Search className="h-5 w-5" />
              </button>
              {!authLoading && (
                <>
                  {user ? (
                    <div className="relative" ref={userMenuRef}>
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen((o) => !o)}
                        className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100 min-h-[44px]"
                      >
                        <span className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </span>
                        <span className="max-w-[120px] truncate">
                          {user.firstName || user.email}
                        </span>
                      </button>
                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white shadow-card-hover border border-primary-100 py-1 z-50"
                          >
                            <div className="px-4 py-3 border-b border-primary-100">
                              <p className="text-sm font-medium text-primary-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-primary-500 truncate">{user.email}</p>
                            </div>
                            <Link
                              to="/tai-khoan"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50"
                            >
                              <User className="h-4 w-4" />
                              Tài khoản của tôi
                            </Link>
                            <button
                              type="button"
                              onClick={() => { logout(); setUserMenuOpen(false); setOpen(false); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50"
                            >
                              <LogOut className="h-4 w-4" />
                              Đăng xuất
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      to="/dang-nhap"
                      className="hidden sm:inline-flex items-center justify-center rounded-lg border-2 border-primary-800 px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-50 min-h-[44px]"
                    >
                      Đăng nhập
                    </Link>
                  )}
                </>
              )}
              <Link
                to="/dang-ky-hoc-thu"
                className="hidden sm:inline-flex items-center justify-center rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-primary-900 shadow-sm hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors min-h-[44px]"
              >
                Đăng ký học thử
              </Link>
              <button
                type="button"
                className="lg:hidden p-2.5 rounded-lg text-primary-600 hover:bg-primary-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => setOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={open}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden border-t border-primary-200"
              >
                <div className="py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                  {navLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center',
                        location.pathname === to ? 'bg-accent-50 text-accent-700' : 'text-primary-600 hover:bg-primary-50',
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-primary-100 pt-2 mt-2 px-4">
                    <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Tiện ích</p>
                    {quickLinks.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setOpen(false)}
                        className="block py-2.5 text-sm text-primary-600 hover:text-accent-600 min-h-[44px] flex items-center"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  {!authLoading && (
                    user ? (
                      <>
                        <Link
                          to="/tai-khoan"
                          onClick={() => setOpen(false)}
                          className="mx-4 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100 text-sm font-medium text-primary-900"
                        >
                          <User className="h-4 w-4" />
                          Tài khoản của tôi
                        </Link>
                        <div className="mx-4 mt-2 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-between">
                          <span className="text-sm font-medium text-primary-900 truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <button
                          type="button"
                          onClick={() => { logout(); setOpen(false); }}
                          className="flex items-center gap-2 text-sm text-primary-600 hover:text-accent-600"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                        </div>
                      </>
                    ) : (
                      <Link
                        to="/dang-nhap"
                        onClick={() => setOpen(false)}
                        className="mx-4 mt-2 flex items-center justify-center rounded-lg border-2 border-primary-800 px-5 py-3 text-sm font-semibold text-primary-800 min-h-[48px]"
                      >
                        Đăng nhập
                      </Link>
                    )
                  )}
                  <Link
                    to="/dang-ky-hoc-thu"
                    onClick={() => setOpen(false)}
                    className="mx-4 mt-4 flex items-center justify-center rounded-lg bg-accent-500 px-5 py-3.5 text-sm font-semibold text-primary-900 min-h-[48px]"
                  >
                    Đăng ký học thử miễn phí
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
      <SearchModal isOpen={searchOpen} onClose={() => dispatch(closeSearch())} />
    </>
  );
}
