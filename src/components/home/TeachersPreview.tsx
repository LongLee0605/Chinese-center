import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import TeacherCard from '@/components/teachers/TeacherCard';
import Button from '@/components/ui/Button';
import { useGetTeachersQuery } from '@/store/apiSlice';
import { getUploadsBase } from '@/lib/api';

function mapApiTeacherToCard(t: {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarPath?: string;
  specializations?: string[];
  yearsExperience?: number;
}) {
  const parts = (t.name || '').trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts[0] : '';
  const firstName = parts.length > 1 ? parts.slice(1).join(' ') : t.name || '';
  const uploadsBase = getUploadsBase();
  return {
    id: t.id,
    firstName: firstName || '—',
    lastName: lastName || '—',
    role: t.title ?? 'Giáo viên',
    bio: t.bio ?? '',
    avatar: t.avatarPath ? `${uploadsBase}/uploads/${t.avatarPath}` : null,
    specializations: t.specializations ?? [],
    yearsExperience: t.yearsExperience,
  };
}

const PREVIEW_LIMIT = 6;

export default function TeachersPreview() {
  const { data, isLoading, isError } = useGetTeachersQuery();
  const items = data?.items ?? [];
  const teachers = items.slice(0, PREVIEW_LIMIT).map(mapApiTeacherToCard);

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          overline="Đội ngũ"
          title="Giáo viên chuyên nghiệp, tận tâm"
          subtitle="100% giáo viên có chứng chỉ sư phạm và kinh nghiệm giảng dạy tiếng Trung."
        />
        <div className="mt-5 flex items-center justify-center gap-2 text-primary-600">
          <Award className="h-5 w-5 text-accent-500 shrink-0" />
          <span className="text-sm font-medium">Chứng chỉ HSK6, phương pháp chuẩn quốc tế</span>
        </div>
        {isLoading && (
          <p className="section-content-mt text-center text-primary-500">Đang tải đội ngũ giáo viên...</p>
        )}
        {isError && (
          <p className="section-content-mt text-center text-primary-500">Không tải được danh sách giáo viên.</p>
        )}
        {!isLoading && !isError && teachers.length === 0 && (
          <p className="section-content-mt text-center text-primary-500">Chưa có thông tin giáo viên.</p>
        )}
        {!isLoading && teachers.length > 0 && (
          <>
            <div className="section-content-mt grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {teachers.map((teacher, i) => (
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
              className="section-content-mt text-center"
            >
              <Link to="/doi-ngu-giao-vien">
                <Button variant="outline" size="lg" className="group">
                  Xem toàn bộ đội ngũ
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
