import { motion } from 'framer-motion';
import { Target, Eye, Heart } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="section-padding bg-primary-50">
        <div className="container-narrow">
          <SectionTitle
            overline="Về chúng tôi"
            title="Chinese Center – Trung tâm tiếng Trung chuyên nghiệp"
            subtitle="Chúng tôi ra đời với sứ mệnh mang đến môi trường học tiếng Trung chất lượng cao, gắn liền văn hóa và thực tiễn."
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 prose prose-slate max-w-none"
          >
            <p className="text-lg text-primary-600 leading-relaxed">
              Chinese Center được thành lập bởi đội ngũ có nhiều năm học tập và làm việc tại Trung Quốc. 
              Chúng tôi hiểu rằng học một ngôn ngữ không chỉ là từ vựng và ngữ pháp, mà còn là hiểu văn hóa, 
              con người và cơ hội trong tương lai.
            </p>
            <p className="mt-6 text-lg text-primary-600 leading-relaxed">
              Với giáo trình bám sát chuẩn HSK, đội ngũ giáo viên bản ngữ và giáo viên Việt giàu kinh nghiệm, 
              cùng mô hình lớp học nhỏ (tối đa 15 học viên), chúng tôi cam kết từng buổi học đều chất lượng và 
              học viên tiến bộ rõ rệt.
            </p>
          </motion.div>
        </div>
      </section>
      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="text-2xl font-bold text-primary-900 text-center mb-12">Sứ mệnh & Giá trị</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: 'Sứ mệnh', desc: 'Giúp mọi học viên đạt được mục tiêu tiếng Trung của mình, từ giao tiếp cơ bản đến thi chứng chỉ HSK và ứng dụng trong công việc.' },
              { icon: Eye, title: 'Tầm nhìn', desc: 'Trở thành trung tâm tiếng Trung uy tín hàng đầu, gắn kết văn hóa Việt – Trung và mở ra cơ hội cho học viên.' },
              { icon: Heart, title: 'Giá trị cốt lõi', desc: 'Chất lượng – Tận tâm – Minh bạch. Chúng tôi đặt lợi ích và sự tiến bộ của học viên lên hàng đầu.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-primary-200 bg-primary-50/50 p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-primary-900">{item.title}</h3>
                <p className="mt-2 text-primary-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
