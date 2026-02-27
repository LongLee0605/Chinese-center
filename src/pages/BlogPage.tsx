import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';

const POSTS = [
  { id: '1', slug: 'cach-hoc-tieng-trung-hieu-qua', title: '5 cách học tiếng Trung hiệu quả cho người mới', date: '2024-01-15', excerpt: 'Gợi ý phương pháp và thói quen học tập giúp bạn tiến bộ nhanh khi mới bắt đầu.' },
  { id: '2', slug: 'luyen-thi-hsk-tips', title: 'Bí quyết luyện thi HSK đạt điểm cao', date: '2024-01-10', excerpt: 'Chia sẻ kinh nghiệm ôn tập và làm bài thi HSK từ giáo viên và học viên đạt điểm tốt.' },
  { id: '3', slug: 'van-hoa-trung-hoa', title: 'Tìm hiểu văn hóa Trung Hoa qua ngôn ngữ', date: '2024-01-05', excerpt: 'Học tiếng Trung không chỉ là từ vựng – khám phá văn hóa qua thành ngữ và phong tục.' },
  { id: '4', slug: 'tieng-trung-thieu-nhi', title: 'Nên cho con học tiếng Trung từ độ tuổi nào?', date: '2023-12-28', excerpt: 'Độ tuổi vàng và phương pháp dạy tiếng Trung cho trẻ em hiệu quả.' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Tin tức" />
      <section className="section-padding">
        <div className="container-wide">
          <SectionTitle
            overline="Tin tức"
            title="Bài viết & Mẹo học"
            subtitle="Cập nhật mẹo học tiếng Trung, kinh nghiệm luyện thi HSK và thông tin từ trung tâm."
          />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POSTS.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/tin-tuc/${post.slug}`}
                  className="block rounded-xl border border-primary-200 bg-white p-5 shadow-card hover:shadow-card-hover hover:border-accent-100 transition-all h-full flex flex-col"
                >
                  <div className="h-2 w-16 rounded-full bg-accent-500 mb-4" />
                  <h3 className="font-bold text-primary-900 line-clamp-2 mb-2">{post.title}</h3>
                  <p className="text-sm text-primary-600 line-clamp-2 flex-1">{post.excerpt}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-primary-500">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </p>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
