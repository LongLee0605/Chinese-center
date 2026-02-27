import { motion } from 'framer-motion';
import SectionTitle from '@/components/ui/SectionTitle';
import TeacherCard from '@/components/teachers/TeacherCard';
import { useGetTeachersQuery } from '@/store/apiSlice';

const uploadsBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
  : '';

function mapApiTeacherToCard(t: { id: string; name: string; title?: string; bio?: string; avatarPath?: string; specializations?: string[]; yearsExperience?: number }) {
  const parts = (t.name || '').trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts[0] : '';
  const firstName = parts.length > 1 ? parts.slice(1).join(' ') : t.name || '';
  return {
    id: t.id,
    firstName: firstName || '—',
    lastName: lastName || '—',
    role: t.title ?? 'Giáo viên',
    bio: t.bio ?? '',
    avatar: t.avatarPath ? (uploadsBase + '/uploads/' + t.avatarPath) : null,
    specializations: t.specializations ?? [],
    yearsExperience: t.yearsExperience,
  };
}

export default function TeachersPage() {
  const { data, isLoading, isError } = useGetTeachersQuery();
  const items = data?.items ?? [];
  const teachers = items.map(mapApiTeacherToCard);

  return (
    <div className="min-h-screen">
      <section className="section-padding bg-primary-50">
        <div className="container-wide">
          <SectionTitle
            overline="Đội ngũ"
            title="Giáo viên chuyên nghiệp"
            subtitle="Đội ngũ giáo viên được tuyển chọn kỹ lưỡng: giáo viên bản ngữ và giáo viên Việt có chứng chỉ, kinh nghiệm giảng dạy và tận tâm với học viên."
          />
          {isLoading && <p className="mt-12 text-center text-primary-500">Đang tải...</p>}
          {isError && <p className="mt-12 text-center text-primary-500">Không tải được danh sách giáo viên.</p>}
          {!isLoading && teachers.length === 0 && (
            <p className="mt-12 text-center text-primary-500">Chưa có thông tin giáo viên.</p>
          )}
          {!isLoading && teachers.length > 0 && (
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
          )}
        </div>
      </section>
    </div>
  );
}
