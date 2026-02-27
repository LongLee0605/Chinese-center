import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import { useGetPostsQuery } from '@/store/apiSlice';

export default function BlogPage() {
  const { data, isLoading, isError } = useGetPostsQuery({ page: 1, limit: 20 });
  const posts = data?.items ?? [];

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
          {isLoading && (
            <p className="mt-10 text-center text-primary-500">Đang tải...</p>
          )}
          {isError && (
            <p className="mt-10 text-center text-primary-500">Không tải được bài viết. Vui lòng thử lại sau.</p>
          )}
          {!isLoading && !isError && posts.length === 0 && (
            <p className="mt-10 text-center text-primary-500">Chưa có bài viết nào.</p>
          )}
          {!isLoading && posts.length > 0 && (
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.map((post, i) => (
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
                    <p className="text-sm text-primary-600 line-clamp-2 flex-1">{post.excerpt ?? ''}</p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-primary-500">
                      <Calendar className="h-4 w-4" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
                        : ''}
                    </p>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
