import { useState } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import CourseCard from '@/components/courses/CourseCard';
import { useGetCoursesQuery } from '@/store/apiSlice';

const filters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'HSK1', label: 'HSK 1' },
  { value: 'HSK2', label: 'HSK 2' },
  { value: 'HSK3', label: 'HSK 3' },
  { value: 'HSK4', label: 'HSK 4' },
  { value: 'KIDS', label: 'Thiếu nhi' },
  { value: 'BUSINESS', label: 'Doanh nghiệp' },
];

export default function CoursesPage() {
  const [level, setLevel] = useState('all');
  const { data, isLoading, isError } = useGetCoursesQuery();
  const items = data?.items ?? [];
  const filtered = level === 'all'
    ? items
    : items.filter((c) => (c.level || '').toUpperCase() === level);

  const coursesForCard = filtered.map((c) => ({
    id: c.id,
    name: c.name,
    nameZh: c.nameZh ?? undefined,
    level: c.level ?? '',
    duration: c.duration ?? 0,
    price: c.price ?? 0,
    slug: c.slug,
    thumbnail: c.thumbnail ?? null,
    description: c.description ?? undefined,
  }));

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
          {isLoading && <p className="text-center text-primary-500">Đang tải...</p>}
          {isError && <p className="text-center text-primary-500">Không tải được danh sách khóa học.</p>}
          {!isLoading && !isError && coursesForCard.length === 0 && (
            <p className="text-center text-primary-500">Chưa có khóa học nào.</p>
          )}
          {!isLoading && coursesForCard.length > 0 && (
            <motion.div
              layout
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {coursesForCard.map((course, i) => (
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
          )}
        </div>
      </section>
    </div>
  );
}
