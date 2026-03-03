import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import { useGetPostsQuery } from '@/store/apiSlice';

const PREVIEW_LIMIT = 3;

export default function PostsPreview() {
  const { data, isLoading, isError } = useGetPostsQuery({ page: 1, limit: PREVIEW_LIMIT });
  const rawItems = data?.items;
  const posts = Array.isArray(rawItems) ? rawItems : [];

  return (
    <section className="section-padding bg-primary-50">
      <div className="container-wide">
        <SectionTitle
          overline="Tin tức"
          title="Bài viết & Mẹo học"
          subtitle="Cập nhật mẹo học tiếng Trung, kinh nghiệm luyện thi HSK và thông tin từ trung tâm."
        />
        {isLoading && (
          <p className="mt-10 text-center text-primary-500">Đang tải tin tức...</p>
        )}
        {isError && (
          <p className="mt-10 text-center text-primary-500">Không tải được bài viết.</p>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <p className="mt-10 text-center text-primary-500">Chưa có bài viết nào.</p>
        )}
        {!isLoading && posts.length > 0 && (
          <>
            <div className="mt-10 grid sm:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article
                  key={post?.id ?? i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Link
                    to={`/tin-tuc/${post?.slug ?? ''}`}
                    className="block rounded-xl border border-primary-200 bg-white p-5 shadow-card hover:shadow-card-hover hover:border-accent-100 transition-all h-full flex flex-col"
                  >
                    <div className="h-2 w-16 rounded-full bg-accent-500 mb-4" />
                    <h3 className="font-bold text-primary-900 line-clamp-2 mb-2">{post?.title ?? ''}</h3>
                    <p className="text-sm text-primary-600 line-clamp-2 flex-1">
                      {post?.excerpt ?? ''}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-primary-500">
                      <Calendar className="h-4 w-4" />
                      {post?.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
                        : ''}
                    </p>
                  </Link>
                </motion.article>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <Link to="/tin-tuc">
                <Button variant="outline" size="lg" className="group">
                  Xem tất cả tin tức
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
