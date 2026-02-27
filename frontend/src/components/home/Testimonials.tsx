import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';

const testimonials = [
  {
    id: '1',
    content: 'Mình học HSK1 tại trung tâm, giáo viên rất nhiệt tình và phương pháp dễ hiểu. Sau 3 tháng đã giao tiếp cơ bản được.',
    author: 'Nguyễn Thị Hương',
    role: 'Học viên HSK1',
  },
  {
    id: '2',
    content: 'Con mình học khóa thiếu nhi, bé rất thích và tiến bộ rõ rệt. Lớp học vui, có hoạt động văn hóa Trung Hoa rất bổ ích.',
    author: 'Trần Văn Nam',
    role: 'Phụ huynh học viên',
  },
  {
    id: '3',
    content: 'Đội ngũ giáo viên chuyên nghiệp, lộ trình học rõ ràng. Mình đã đạt HSK4 sau 2 năm học tại đây.',
    author: 'Lê Minh Tuấn',
    role: 'Học viên HSK4',
  },
];

export default function Testimonials() {
  return (
    <section className="section-padding bg-primary-50">
      <div className="container-wide">
        <SectionTitle
          overline="Cảm nhận"
          title="Học viên nói gì về chúng tôi"
          subtitle="Hàng nghìn học viên đã tin tưởng và đồng hành cùng Chinese Center."
        />
        <div className="mt-10 sm:mt-12 grid md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-primary-200 bg-white p-5 sm:p-6 lg:p-8"
            >
              <Quote className="h-9 w-9 sm:h-10 sm:w-10 text-accent-200" />
              <blockquote className="mt-4 text-primary-700 text-sm sm:text-base leading-relaxed">
                "{item.content}"
              </blockquote>
              <footer className="mt-5 sm:mt-6">
                <p className="font-semibold text-primary-900">{item.author}</p>
                <p className="text-sm text-primary-500">{item.role}</p>
              </footer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
