import { motion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';

const SAMPLE_SCHEDULE = [
  { course: 'HSK 1 - Nhập môn', time: '18:00 - 19:30', days: ['Thứ 2', 'Thứ 4', 'Thứ 6'], room: 'Phòng 101' },
  { course: 'HSK 2 - Sơ cấp', time: '18:00 - 19:30', days: ['Thứ 3', 'Thứ 5'], room: 'Phòng 102' },
  { course: 'HSK 3 - Trung cấp', time: '19:45 - 21:15', days: ['Thứ 2', 'Thứ 4'], room: 'Phòng 101' },
  { course: 'Tiếng Trung thiếu nhi', time: '09:00 - 10:30', days: ['Thứ 7'], room: 'Phòng 201' },
  { course: 'HSK 1 (Sáng)', time: '08:30 - 10:00', days: ['Thứ 3', 'Thứ 5'], room: 'Phòng 102' },
];

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Lịch học" />
      <section className="section-padding">
        <div className="container-wide">
          <SectionTitle
            overline="Lịch khai giảng"
            title="Lịch học các khóa"
            subtitle="Tham khảo lịch học mẫu. Lịch thực tế có thể thay đổi theo từng đợt tuyển sinh. Liên hệ để đăng ký lớp phù hợp."
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 overflow-x-auto -mx-4 sm:mx-0"
          >
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full rounded-xl border border-primary-200 bg-white shadow-card overflow-hidden">
                <thead>
                  <tr className="border-b border-primary-200 bg-primary-50">
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-primary-900">Khóa học</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-primary-900">Giờ học</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-primary-900">Thứ</th>
                    <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-primary-900 hidden sm:table-cell">Phòng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {SAMPLE_SCHEDULE.map((row, i) => (
                    <tr key={i} className="hover:bg-primary-50/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-medium text-primary-900">{row.course}</td>
                      <td className="py-4 px-4 sm:px-6 text-primary-600 flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        {row.time}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-primary-600">{row.days.join(', ')}</td>
                      <td className="py-4 px-4 sm:px-6 text-primary-600 hidden sm:flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {row.room}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <p className="mt-6 text-sm text-primary-500 text-center">
            Lịch có thể cập nhật theo từng kỳ. Vui lòng gọi hotline hoặc đăng ký học thử để được tư vấn lớp phù hợp.
          </p>
        </div>
      </section>
    </div>
  );
}
