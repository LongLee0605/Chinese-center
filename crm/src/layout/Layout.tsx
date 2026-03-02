import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, BookOpen, ClipboardList, LayoutDashboard, LogOut, Mail, Inbox, Users, LayoutGrid } from 'lucide-react';

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/posts', label: 'Bài viết', icon: FileText },
  { to: '/courses', label: 'Khóa học', icon: BookOpen },
  { to: '/quizzes', label: 'Bài test', icon: ClipboardList },
  { to: '/teachers', label: 'Giáo viên', icon: Users },
  { to: '/leads', label: 'Email đăng ký', icon: Inbox },
  { to: '/mail', label: 'Gửi email', icon: Mail },
];

function getInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim().slice(0, 1) ?? '';
  const b = lastName?.trim().slice(0, 1) ?? '';
  return (a + b).toUpperCase() || '?';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-crm-side text-white">
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crm-accent">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight">Chinese Center</span>
              <span className="block text-xs text-slate-400">CRM</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {nav.map(({ to, label, icon: Icon }) => {
            const isActive =
              location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-crm-sideActive text-white'
                    : 'text-slate-300 hover:bg-crm-sideHover hover:text-white'
                }`}
              >
                <Icon size={20} className="flex-shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-crm-sideActive text-sm font-medium text-slate-200">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-crm-sideHover hover:text-white transition-colors mt-1"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
