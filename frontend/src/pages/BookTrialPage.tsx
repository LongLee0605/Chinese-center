import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';

const COURSE_OPTIONS = [
  { value: 'hsk1', label: 'HSK 1 - Nhập môn' },
  { value: 'hsk2', label: 'HSK 2 - Sơ cấp' },
  { value: 'hsk3', label: 'HSK 3 - Trung cấp' },
  { value: 'kids', label: 'Tiếng Trung thiếu nhi' },
  { value: 'other', label: 'Khác (để tư vấn viên gọi)' },
];

const TIME_OPTIONS = [
  'Sáng (8h–12h)',
  'Chiều (13h–17h)',
  'Tối (18h–21h)',
  'Cuối tuần',
];

export default function BookTrialPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Đăng ký học thử" />
      <section className="section-padding">
        <div className="container-narrow">
          <SectionTitle
            overline="Miễn phí 1 buổi"
            title="Đăng ký học thử"
            subtitle="Điền form bên dưới, chúng tôi sẽ xếp lịch học thử 1 buổi miễn phí và gọi lại xác nhận trong 24 giờ."
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 shadow-card"
          >
            {sent ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-lg font-semibold text-accent-600">Đăng ký thành công!</p>
                <p className="mt-2 text-primary-600 max-w-md mx-auto">
                  Chúng tôi sẽ liên hệ trong vòng 24 giờ để xếp lịch học thử cho bạn.
                </p>
                <Link to="/khoa-hoc" className="mt-6 inline-block">
                  <Button variant="outline">Xem khóa học</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-primary-900 mb-1.5">Họ tên *</label>
                    <input id="name" name="name" type="text" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-primary-900 mb-1.5">Số điện thoại *</label>
                    <input id="phone" name="phone" type="tel" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="0901234567" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-1.5">Email *</label>
                  <input id="email" name="email" type="email" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">Khóa học quan tâm *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COURSE_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 rounded-lg border border-primary-200 px-4 py-3 cursor-pointer hover:bg-primary-50 min-h-[44px]">
                        <input type="radio" name="course" value={opt.value} required className="w-4 h-4 text-accent-600 focus:ring-accent-500" />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">Khung giờ mong muốn</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((t) => (
                      <label key={t} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 px-4 py-2.5 cursor-pointer hover:bg-primary-50">
                        <input type="checkbox" name="time" value={t} className="w-4 h-4 text-accent-600 focus:ring-accent-500 rounded" />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-primary-900 mb-1.5">Ghi chú</label>
                  <textarea id="note" name="note" rows={3} className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="Trình độ hiện tại, mục tiêu học..." />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto group">
                  Gửi đăng ký
                  <Send className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
