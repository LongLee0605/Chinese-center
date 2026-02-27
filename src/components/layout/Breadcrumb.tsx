import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const pathLabels: Record<string, string> = {
  'khoa-hoc': 'Khóa học',
  'doi-ngu-giao-vien': 'Đội ngũ giáo viên',
  'lien-he': 'Liên hệ',
  've-chung-toi': 'Về chúng tôi',
  'kiem-tra-trinh-do': 'Kiểm tra trình độ',
  'dang-ky-hoc-thu': 'Đăng ký học thử',
  'lich-hoc': 'Lịch học',
  'cau-hoi-thuong-gap': 'Câu hỏi thường gặp',
  'tin-tuc': 'Tin tức',
  'bai-test': 'Bài kiểm tra',
};

interface BreadcrumbProps {
  currentLabel?: string;
  className?: string;
}

export default function Breadcrumb({ currentLabel, className }: BreadcrumbProps) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('container-wide px-4 sm:px-6 lg:px-8 py-4 sm:py-5', className)}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-primary-600">
        <li>
          <Link to="/" className="hover:text-accent-600 transition-colors">
            Trang chủ
          </Link>
        </li>
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const path = '/' + segments.slice(0, i + 1).join('/');
          const label = isLast && currentLabel ? currentLabel : pathLabels[segment] || segment;
          return (
            <li key={path} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 shrink-0 text-primary-400" />
              {isLast ? (
                <span className="font-medium text-primary-900" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link to={path} className="hover:text-accent-600 transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
