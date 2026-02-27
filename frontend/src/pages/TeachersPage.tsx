import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import TeacherCard from '@/components/teachers/TeacherCard';

const teachers = [
  { id: '1', firstName: 'Nguyễn', lastName: 'Văn An', role: 'Giáo viên trưởng', bio: 'Cử nhân Ngôn ngữ Trung Quốc, 8 năm kinh nghiệm. Chứng chỉ HSK6, HSKK Cao cấp. Chuyên luyện thi HSK và giao tiếp thương mại.', avatar: null, specializations: ['HSK1', 'HSK2', 'HSK3'], yearsExperience: 8 },
  { id: '2', firstName: 'Trần', lastName: 'Thị Bình', role: 'Giáo viên bản ngữ', bio: 'Người bản xứ Bắc Kinh. Chuyên luyện phát âm chuẩn và giao tiếp thực tế. Có kinh nghiệm dạy học viên Việt Nam nhiều năm.', avatar: null, specializations: ['HSK2', 'HSK3', 'HSK4'], yearsExperience: 5 },
  { id: '3', firstName: 'Lê', lastName: 'Minh Cường', role: 'Giáo viên', bio: 'Thạc sĩ Giáo dục học. Chuyên khóa học thiếu nhi và luyện thi HSK. Phương pháp vui học, dễ nhớ.', avatar: null, specializations: ['KIDS', 'HSK4', 'HSK5'], yearsExperience: 6 },
  { id: '4', firstName: 'Phạm', lastName: 'Thu Hà', role: 'Giáo viên', bio: 'Cử nhân Sư phạm tiếng Trung. 5 năm kinh nghiệm dạy HSK1–HSK3. Nhiệt tình, kiên nhẫn với học viên mới.', avatar: null, specializations: ['HSK1', 'HSK2'], yearsExperience: 5 },
  { id: '5', firstName: 'Hoàng', lastName: 'Văn Đức', role: 'Giáo viên bản ngữ', bio: 'Người bản xứ Thượng Hải. Chuyên tiếng Trung thương mại và văn hóa doanh nghiệp Trung Quốc.', avatar: null, specializations: ['BUSINESS', 'HSK4', 'HSK5'], yearsExperience: 7 },
  { id: '6', firstName: 'Võ', lastName: 'Thị Mai', role: 'Giáo viên', bio: 'Chứng chỉ HSK6, chuyên luyện thi và kỹ năng đọc hiểu. Giúp nhiều học viên đạt điểm cao trong kỳ thi HSK.', avatar: null, specializations: ['HSK4', 'HSK5', 'HSK6'], yearsExperience: 6 },
];

export default function TeachersPage() {
  return (
    <div className="min-h-screen">
      <section className="section-padding bg-primary-50">
        <div className="container-wide">
          <SectionTitle
            overline="Đội ngũ"
            title="Giáo viên chuyên nghiệp"
            subtitle="Đội ngũ giáo viên được tuyển chọn kỹ lưỡng: giáo viên bản ngữ và giáo viên Việt có chứng chỉ, kinh nghiệm giảng dạy và tận tâm với học viên."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((teacher, i) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <TeacherCard teacher={teacher} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
