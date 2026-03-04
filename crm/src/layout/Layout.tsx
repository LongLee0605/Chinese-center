import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, BookOpen, ClipboardList, LayoutDashboard, LogOut, Mail, Inbox, LayoutGrid, UserCog, UserPlus, GraduationCap, Menu, X } from 'lucide-react';
import NotificationsBell from '../components/NotificationsBell';
import GlobalSearch from '../components/GlobalSearch';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; section?: string };

function getNav(role: string): NavItem[] {
  const hasStaff = role === 'SUPER_ADMIN' || role === 'TEACHER';
  const items: NavItem[] = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/classes', label: 'Lớp học', icon: GraduationCap, section: 'Học offline' },
    { to: '/courses', label: 'Khóa học', icon: BookOpen, section: 'Học online' },
    { to: '/quizzes', label: 'Bài test', icon: ClipboardList, section: 'Học online' },
    { to: '/trial-registrations', label: 'Đăng ký học thử', icon: UserPlus, section: 'Học online' },
    { to: '/posts', label: 'Bài viết', icon: FileText },
    { to: '/leads', label: 'Email đăng ký', icon: Inbox },
    { to: '/mail', label: 'Gửi email', icon: Mail },
  ];
  if (hasStaff) {
    return [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/accounts', label: 'Tài khoản', icon: UserCog },
      { to: '/classes', label: 'Lớp học', icon: GraduationCap, section: 'Học offline' },
      { to: '/courses', label: 'Khóa học', icon: BookOpen, section: 'Học online' },
      { to: '/quizzes', label: 'Bài test', icon: ClipboardList, section: 'Học online' },
      { to: '/trial-registrations', label: 'Đăng ký học thử', icon: UserPlus, section: 'Học online' },
      { to: '/posts', label: 'Bài viết', icon: FileText },
      { to: '/leads', label: 'Email đăng ký', icon: Inbox },
      { to: '/mail', label: 'Gửi email', icon: Mail },
    ];
  }
  return [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/classes', label: 'Lớp học', icon: GraduationCap, section: 'Học offline' },
    { to: '/courses', label: 'Khóa học', icon: BookOpen, section: 'Học online' },
    { to: '/quizzes', label: 'Bài test', icon: ClipboardList, section: 'Học online' },
    { to: '/trial-registrations', label: 'Đăng ký học thử', icon: UserPlus, section: 'Học online' },
    { to: '/posts', label: 'Bài viết', icon: FileText },
    { to: '/leads', label: 'Email đăng ký', icon: Inbox },
    { to: '/mail', label: 'Gửi email', icon: Mail },
  ];
}

function getInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim().slice(0, 1) ?? '';
  const b = lastName?.trim().slice(0, 1) ?? '';
  return (a + b).toUpperCase() || '?';
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = getNav(user?.role ?? '');

  return (
    <>
      <div className="p-4 sm:p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-crm-accent">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-white tracking-tight block truncate">Chinese Center</span>
            <span className="text-xs text-slate-400">CRM</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {(() => {
          const sections = new Map<string, NavItem[]>();
          const noSection: NavItem[] = [];
          nav.forEach((item) => {
            if (item.section) {
              if (!sections.has(item.section)) sections.set(item.section, []);
              sections.get(item.section)!.push(item);
            } else {
              noSection.push(item);
            }
          });
          return (
            <>
              {noSection.map(({ to, label, icon: Icon }) => {
                const isActive =
                  location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 min-h-[44px] ${
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
              {['Học offline', 'Học online'].map((sectionName) => {
                const items = sections.get(sectionName);
                if (!items?.length) return null;
                return (
                  <div key={sectionName} className="mt-4 mb-2">
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {sectionName}
                    </p>
                    {items.map(({ to, label, icon: Icon }) => {
                      const isActive =
                        location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={onNavigate}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 min-h-[44px] ${
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
                  </div>
                );
              })}
            </>
          );
        })()}
      </nav>
      <div className="p-2 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crm-sideActive text-sm font-medium text-slate-200">
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
          onClick={() => { logout(); onNavigate?.(); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-crm-sideHover hover:text-white transition-colors mt-1 min-h-[44px]"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-crm-side text-white fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] flex flex-col bg-crm-side text-white z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-semibold text-white">Menu</span>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Đóng menu"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <SidebarContent onNavigate={closeSidebar} />
        </div>
      </aside>

      {/* Main: offset when desktop sidebar visible */}
      <main className="flex-1 min-w-0 flex flex-col lg:pl-60">
        <header className="flex-shrink-0 flex items-center justify-between gap-3 h-14 min-h-[44px] px-4 sm:px-6 bg-white border-b border-slate-200">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 min-w-0 flex justify-end gap-2">
            <GlobalSearch />
            <NotificationsBell />
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-auto pb-safe">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
