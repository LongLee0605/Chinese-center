import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  khoaHoc: [
    { label: 'HSK 1 - Nhập môn', to: '/khoa-hoc?level=hsk1' },
    { label: 'HSK 2 - Sơ cấp', to: '/khoa-hoc?level=hsk2' },
    { label: 'HSK 3 - Trung cấp', to: '/khoa-hoc?level=hsk3' },
    { label: 'Tiếng Trung thiếu nhi', to: '/khoa-hoc?type=kids' },
  ],
  tienIch: [
    { label: 'Kiểm tra trình độ', to: '/kiem-tra-trinh-do' },
    { label: 'Đăng ký học thử', to: '/dang-ky-hoc-thu' },
    { label: 'Lịch học', to: '/lich-hoc' },
    { label: 'Câu hỏi thường gặp', to: '/cau-hoi-thuong-gap' },
    { label: 'Tin tức', to: '/tin-tuc' },
  ],
  congTy: [
    { label: 'Về chúng tôi', to: '/ve-chung-toi' },
    { label: 'Đội ngũ giáo viên', to: '/doi-ngu-giao-vien' },
    { label: 'Liên hệ', to: '/lien-he' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-primary-300">
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-display text-xl font-bold">
                <span className="text-accent-400">中文</span>
                <span className="text-white"> Center</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-primary-400">
              Trung tâm tiếng Trung chuyên nghiệp với đội ngũ giáo viên bản ngữ, chương trình chuẩn HSK.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Khóa học</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.khoaHoc.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Tiện ích</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.tienIch.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Công ty</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.congTy.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Liên hệ</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent-400 mt-0.5" />
                <span className="text-sm text-primary-400">123 Nguyễn Văn Linh, Q.7, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-accent-400" />
                <a href="tel:02812345678" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                  028 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-accent-400" />
                <a href="mailto:contact@chinese-center.com" className="text-sm text-primary-400 hover:text-accent-400 transition-colors">
                  contact@chinese-center.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-500">
            © {new Date().getFullYear()} Chinese Center. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/lien-he" className="text-primary-500 hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <Link to="/lien-he" className="text-primary-500 hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
