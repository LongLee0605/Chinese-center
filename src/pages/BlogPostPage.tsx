import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useGetPostBySlugQuery } from '@/store/apiSlice';
import { toImageUrl, bodyHtmlForDisplay } from '@/lib/api';
import { bodyLooksLikeHtml, plainTextToHtml } from '@/lib/utils';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useGetPostBySlugQuery(slug!, { skip: !slug });

  if (!slug || isError || (!isLoading && !post)) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          <p className="text-primary-600">Không tìm thấy bài viết.</p>
          <Link to="/tin-tuc" className="mt-4 inline-block text-accent-600 font-medium">← Về tin tức</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center text-primary-500">Đang tải...</div>
      </div>
    );
  }

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
    : '';

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel={post.title} />
      <article className="section-padding">
        <div className="container-narrow">
          <Link to="/tin-tuc" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-accent-600 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Về tin tức
          </Link>
          <header className="mb-8">
            {post.coverImage && (
              <div className="rounded-xl overflow-hidden mb-6 bg-primary-100">
                <img
                  src={toImageUrl(post.coverImage)}
                  alt=""
                  className="w-full h-auto max-h-[420px] object-cover"
                />
              </div>
            )}
            {dateStr && (
              <p className="flex items-center gap-2 text-primary-500 text-sm mb-2">
                <Calendar className="h-4 w-4" />
                {dateStr}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">{post.title}</h1>
          </header>
          <div
            className="prose prose-slate max-w-none text-primary-700 leading-relaxed prose-p:mb-4 prose-ul:my-3 prose-ol:my-3"
            dangerouslySetInnerHTML={
              post.body
                ? {
                    __html: bodyLooksLikeHtml(post.body)
                      ? bodyHtmlForDisplay(post.body)
                      : plainTextToHtml(post.body),
                  }
                : undefined
            }
          />
          {!post.body && post.excerpt && (
            <p className="text-primary-700">{post.excerpt}</p>
          )}
        </div>
      </article>
    </div>
  );
}
