import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import TeacherCard from '@/components/teachers/TeacherCard';
import Button from '@/components/ui/Button';

const featuredTeachers = [
  {
    id: '1',
    firstName: 'Nguyễn',
    lastName: 'Văn An',
    role: 'Giáo viên trưởng',
    bio: 'Cử nhân Ngôn ngữ Trung Quốc, 8 năm kinh nghiệm. Chứng chỉ HSK6, HSKK Cao cấp.',
    avatar: null,
    specializations: ['HSK1', 'HSK2', 'HSK3'],
    yearsExperience: 8,
  },
  {
    id: '2',
    firstName: 'Trần',
    lastName: 'Thị Bình',
    role: 'Giáo viên bản ngữ',
    bio: 'Người bản xứ Bắc Kinh. Chuyên luyện phát âm và giao tiếp thực tế.',
    avatar: null,
    specializations: ['HSK2', 'HSK3', 'HSK4'],
    yearsExperience: 5,
  },
  {
    id: '3',
    firstName: 'Lê',
    lastName: 'Minh Cường',
    role: 'Giáo viên',
    bio: 'Thạc sĩ Giáo dục học, chuyên khóa học thiếu nhi và luyện thi HSK.',
    avatar: null,
    specializations: ['KIDS', 'HSK4', 'HSK5'],
    yearsExperience: 6,
  },
];

export default function TeachersPreview() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          overline="Đội ngũ"
          title="Giáo viên chuyên nghiệp, tận tâm"
          subtitle="100% giáo viên có chứng chỉ sư phạm và kinh nghiệm giảng dạy tiếng Trung."
        />
        <div className="mt-4 flex items-center justify-center gap-2 text-primary-600">
          <Award className="h-5 w-5 text-accent-500 shrink-0" />
          <span className="text-sm font-medium">Chứng chỉ HSK6, phương pháp chuẩn quốc tế</span>
        </div>
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredTeachers.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <TeacherCard teacher={teacher} />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 sm:mt-12 text-center"
        >
          <Link to="/doi-ngu-giao-vien">
            <Button variant="outline" size="lg" className="group">
              Xem toàn bộ đội ngũ
              <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
