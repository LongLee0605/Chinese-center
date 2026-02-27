import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, BookOpen, ClipboardList, LayoutDashboard, LogOut, Mail, Inbox, Users } from 'lucide-react';

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/posts', label: 'Bài viết (Tin tức)', icon: FileText },
  { to: '/courses', label: 'Khóa học', icon: BookOpen },
  { to: '/quizzes', label: 'Bài test', icon: ClipboardList },
  { to: '/teachers', label: 'Đội ngũ giáo viên', icon: Users },
  { to: '/leads', label: 'Email đăng ký', icon: Inbox },
  { to: '/mail', label: 'Gửi email', icon: Mail },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <span className="font-semibold">Chinese Center CRM</span>
        </div>
        <nav className="flex-1 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-md mb-1 ${
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-700">
          <div className="px-3 py-2 text-sm text-gray-400 truncate">
            {user?.firstName} {user?.lastName}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
