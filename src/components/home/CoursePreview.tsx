import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import CourseCard from '@/components/courses/CourseCard';
import Button from '@/components/ui/Button';
import { useGetCoursesQuery } from '@/store/apiSlice';

const PREVIEW_LIMIT = 6;

export default function CoursePreview() {
  const { data, isLoading, isError } = useGetCoursesQuery();
  const rawItems = data?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];
  const courses = items.slice(0, PREVIEW_LIMIT).map((c: Record<string, unknown>) => ({
    id: String(c?.id ?? ''),
    name: String(c?.name ?? ''),
    nameZh: c?.nameZh != null ? String(c.nameZh) : undefined,
    level: String(c?.level ?? ''),
    duration: Number(c?.duration ?? 0),
    price: Number(c?.price ?? 0),
    slug: String(c?.slug ?? ''),
    thumbnail: c?.thumbnail != null ? String(c.thumbnail) : null,
    description: c?.description != null ? String(c.description) : undefined,
  }));

  return (
    <section className="section-padding bg-primary-50">
      <div className="container-wide">
        <SectionTitle
          overline="Khóa học"
          title={
            <>
              Chương trình đa dạng
              <br />
              <span className="text-accent-600">từ HSK1 đến HSK6</span>
            </>
          }
          subtitle="Lộ trình rõ ràng, giáo trình chuẩn quốc tế, học với giáo viên bản ngữ và giáo viên Việt giàu kinh nghiệm."
        />
        {isLoading && (
          <p className="mt-10 text-center text-primary-500">Đang tải khóa học...</p>
        )}
        {isError && (
          <p className="mt-10 text-center text-primary-500">Không tải được danh sách khóa học.</p>
        )}
        {!isLoading && !isError && courses.length === 0 && (
          <p className="mt-10 text-center text-primary-500">Chưa có khóa học nào.</p>
        )}
        {!isLoading && courses.length > 0 && (
          <>
            <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-10 sm:mt-12 text-center"
            >
              <Link to="/khoa-hoc">
                <Button variant="outline" size="lg" className="group">
                  Xem tất cả khóa học
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
