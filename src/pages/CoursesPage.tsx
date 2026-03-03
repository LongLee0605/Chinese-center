import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import CourseCard from '@/components/courses/CourseCard';
import { useGetCoursesQuery } from '@/store/apiSlice';

const LEVEL_LABELS: Record<string, string> = {
  HSK1: 'HSK 1',
  HSK2: 'HSK 2',
  HSK3: 'HSK 3',
  HSK4: 'HSK 4',
  HSK5: 'HSK 5',
  HSK6: 'HSK 6',
  Beginner: 'Beginner',
  Kids: 'Thiếu nhi',
  BUSINESS: 'Doanh nghiệp',
};

function levelToLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

export default function CoursesPage() {
  const [level, setLevel] = useState('all');
  const { data, isLoading, isError } = useGetCoursesQuery();
  const rawItems = data?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  const filters = useMemo(() => {
    const levels = [...new Set(items.map((c) => (c.level || '').trim()).filter(Boolean))];
    levels.sort((a, b) => {
      const order = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Beginner', 'Kids', 'BUSINESS'];
      const i = order.indexOf(a);
      const j = order.indexOf(b);
      if (i !== -1 && j !== -1) return i - j;
      if (i !== -1) return -1;
      if (j !== -1) return 1;
      return a.localeCompare(b);
    });
    return [
      { value: 'all', label: 'Tất cả' },
      ...levels.map((value) => ({ value, label: levelToLabel(value) })),
    ];
  }, [items]);

  useEffect(() => {
    const values = filters.map((f) => f.value);
    if (level !== 'all' && !values.includes(level)) setLevel('all');
  }, [filters, level]);

  const filtered = level === 'all'
    ? items
    : items.filter((c) => (c?.level || '').trim() === level);

  const coursesForCard = filtered.map((c) => ({
    id: String(c?.id ?? ''),
    name: String(c?.name ?? ''),
    nameZh: c?.nameZh != null ? c.nameZh : undefined,
    level: String(c?.level ?? ''),
    duration: Number(c?.duration ?? 0),
    price: Number(c?.price ?? 0),
    slug: String(c?.slug ?? ''),
    thumbnail: c?.thumbnail != null ? c.thumbnail : null,
    description: c?.description != null ? c.description : undefined,
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
          <div className="section-content-mt flex flex-wrap gap-3 justify-center">
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
          {isLoading && <p className="section-content-mt text-center text-primary-500">Đang tải...</p>}
          {isError && <p className="section-content-mt text-center text-primary-500">Không tải được danh sách khóa học.</p>}
          {!isLoading && !isError && coursesForCard.length === 0 && (
            <p className="section-content-mt text-center text-primary-500">Chưa có khóa học nào.</p>
          )}
          {!isLoading && coursesForCard.length > 0 && (
            <motion.div
              layout
              className="section-content-mt grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
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
