import { useState } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import CourseCard from '@/components/courses/CourseCard';

const allCourses = [
  { id: '1', name: 'HSK 1 - Nhập môn', nameZh: 'HSK一级', level: 'HSK1', duration: 40, price: 2500000, slug: 'hsk1-nhap-mon', thumbnail: null, description: 'Cho người mới bắt đầu, 150 từ vựng cơ bản.' },
  { id: '2', name: 'HSK 2 - Sơ cấp', nameZh: 'HSK二级', level: 'HSK2', duration: 50, price: 3000000, slug: 'hsk2-so-cap', thumbnail: null, description: 'Nâng cao vốn từ, giao tiếp hàng ngày.' },
  { id: '3', name: 'HSK 3 - Trung cấp', nameZh: 'HSK三级', level: 'HSK3', duration: 60, price: 3500000, slug: 'hsk3-trung-cap', thumbnail: null, description: '600 từ vựng, giao tiếp công việc và du lịch.' },
  { id: '4', name: 'HSK 4', nameZh: 'HSK四级', level: 'HSK4', duration: 80, price: 4200000, slug: 'hsk4', thumbnail: null, description: 'Trình độ trung cao cấp, đọc hiểu văn bản.' },
  { id: '5', name: 'Tiếng Trung thiếu nhi', nameZh: '少儿汉语', level: 'KIDS', duration: 30, price: 2000000, slug: 'thieu-nhi', thumbnail: null, description: 'Chương trình vui học cho trẻ 6–12 tuổi.' },
  { id: '6', name: 'Tiếng Trung doanh nghiệp', nameZh: '商务汉语', level: 'BUSINESS', duration: 45, price: 3800000, slug: 'doanh-nghiep', thumbnail: null, description: 'Giao tiếp thương mại, đàm phán, email.' },
];

const filters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'HSK1', label: 'HSK 1' },
  { value: 'HSK2', label: 'HSK 2' },
  { value: 'HSK3', label: 'HSK 3' },
  { value: 'KIDS', label: 'Thiếu nhi' },
  { value: 'BUSINESS', label: 'Doanh nghiệp' },
];

export default function CoursesPage() {
  const [level, setLevel] = useState('all');
  const filtered = level === 'all' ? allCourses : allCourses.filter((c) => c.level === level);

  return (
    <div className="min-h-screen">
      <section className="section-padding bg-primary-50">
        <div className="container-wide">
          <SectionTitle
            overline="Khóa học"
            title="Chương trình đào tạo"
            subtitle="Chọn khóa học phù hợp với mục tiêu và trình độ của bạn. Mỗi khóa có lộ trình rõ ràng và giáo trình chuẩn HSK."
          />
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setLevel(f.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  level === f.value
                    ? 'bg-primary-900 text-white'
                    : 'bg-white text-primary-600 hover:bg-primary-100 border border-primary-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="section-padding pt-0">
        <div className="container-wide">
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
