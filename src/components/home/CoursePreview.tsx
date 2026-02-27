import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import CourseCard from '@/components/courses/CourseCard';
import Button from '@/components/ui/Button';

const featuredCourses = [
  {
    id: '1',
    name: 'HSK 1 - Nhập môn',
    nameZh: 'HSK一级',
    level: 'HSK1',
    duration: 40,
    price: 2500000,
    slug: 'hsk1-nhap-mon',
    thumbnail: null,
    description: 'Cho người mới bắt đầu, 150 từ vựng cơ bản.',
  },
  {
    id: '2',
    name: 'HSK 2 - Sơ cấp',
    nameZh: 'HSK二级',
    level: 'HSK2',
    duration: 50,
    price: 3000000,
    slug: 'hsk2-so-cap',
    thumbnail: null,
    description: 'Nâng cao vốn từ, giao tiếp hàng ngày.',
  },
  {
    id: '3',
    name: 'Tiếng Trung thiếu nhi',
    nameZh: '少儿汉语',
    level: 'KIDS',
    duration: 30,
    price: 2000000,
    slug: 'thieu-nhi',
    thumbnail: null,
    description: 'Chương trình vui học cho trẻ 6–12 tuổi.',
  },
];

export default function CoursePreview() {
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
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {featuredCourses.map((course, i) => (
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
      </div>
    </section>
  );
}
