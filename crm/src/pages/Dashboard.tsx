import { Link } from 'react-router-dom';
import { FileText, BookOpen, ClipboardList, UserCog, Inbox, Mail, ChevronRight } from 'lucide-react';

const cards = [
  { to: '/accounts', label: 'Tài khoản', desc: 'User, giảng viên, học viên', icon: UserCog, color: 'bg-sky-500' },
  { to: '/posts', label: 'Bài viết', desc: 'Tin tức, bài đăng', icon: FileText, color: 'bg-violet-500' },
  { to: '/courses', label: 'Khóa học', desc: 'Khóa học & bài học', icon: BookOpen, color: 'bg-emerald-500' },
  { to: '/quizzes', label: 'Bài test', desc: 'Quiz, câu hỏi', icon: ClipboardList, color: 'bg-amber-500' },
  { to: '/leads', label: 'Email đăng ký', desc: 'Liên hệ & đăng ký học thử', icon: Inbox, color: 'bg-rose-500' },
  { to: '/mail', label: 'Gửi email', desc: 'Soạn và gửi email', icon: Mail, color: 'bg-indigo-500' },
];

export default function Dashboard() {
  return (
    <div className="crm-page">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Tổng quan</h1>
        <p className="mt-2 text-slate-500 text-sm">Chọn mục để quản lý nội dung</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {cards.map(({ to, label, desc, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="crm-card p-5 sm:p-6 flex items-center gap-4 hover:shadow-cardHover hover:border-slate-300/80 transition-all group"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${color}`}>
              <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 group-hover:text-crm-accent transition-colors">
                {label}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-crm-accent shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
