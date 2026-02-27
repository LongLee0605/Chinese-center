import { motion } from 'framer-motion';
import { Users, BookOpen, Award, Sparkles } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';

const reasons = [
  {
    icon: Users,
    title: 'Lớp học nhỏ',
    description: 'Tối đa 15 học viên/lớp để giáo viên theo sát từng người, tương tác tối đa.',
  },
  {
    icon: BookOpen,
    title: 'Giáo trình chuẩn HSK',
    description: 'Bám sát khung HSK mới nhất, cập nhật liên tục, phù hợp thi chứng chỉ.',
  },
  {
    icon: Award,
    title: 'Giáo viên chất lượng',
    description: '100% có chứng chỉ sư phạm, kinh nghiệm 5+ năm, kết hợp bản ngữ và Việt.',
  },
  {
    icon: Sparkles,
    title: 'Văn hóa Trung Hoa',
    description: 'Lồng ghép văn hóa, sự kiện ngoại khóa: thư pháp, ẩm thực, lễ hội.',
  },
];

export default function WhyUs() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          overline="Tại sao chọn chúng tôi"
          title="Học tiếng Trung hiệu quả, vui và có lộ trình"
          subtitle="Chinese Center được xây dựng với triết lý: học ngôn ngữ là học văn hóa. Chúng tôi cam kết chất lượng từng buổi học."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {reasons.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-primary-200 bg-primary-50/50 p-5 sm:p-6 text-center hover:border-accent-200 hover:bg-white transition-colors"
            >
              <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mt-4 font-bold text-primary-900 text-base sm:text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-primary-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
