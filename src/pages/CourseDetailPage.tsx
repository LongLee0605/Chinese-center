import { useParams, Link } from 'react-router-dom';
import { BookOpen, Clock, ListOrdered, ArrowRight } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useGetCourseBySlugQuery } from '@/store/apiSlice';
import { formatCurrency } from '@/lib/utils';
import { bodyHtmlForDisplay } from '@/lib/api';
import { bodyLooksLikeHtml, plainTextToHtml } from '@/lib/utils';

const LEVEL_LABELS: Record<string, string> = {
  HSK1: 'HSK 1', HSK2: 'HSK 2', HSK3: 'HSK 3', HSK4: 'HSK 4', HSK5: 'HSK 5', HSK6: 'HSK 6',
  Beginner: 'Beginner', Kids: 'Thiếu nhi', BUSINESS: 'Doanh nghiệp',
};

function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

export default function CourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { data: course, isLoading, isError } = useGetCourseBySlugQuery(courseSlug!, { skip: !courseSlug });

  if (!courseSlug || isError || (!isLoading && !course)) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          <p className="text-primary-600">Không tìm thấy khóa học.</p>
          <Link to="/khoa-hoc" className="mt-4 inline-block text-accent-600 font-medium">
            ← Về danh sách khóa học
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center text-primary-500">Đang tải...</div>
      </div>
    );
  }

  const lessons = course.lessons ?? [];
  const totalMinutes = lessons.reduce((acc, l) => acc + (l.durationMinutes ?? 0), 0);

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel={course.name} />
      <article className="">
        <div className="container-wide px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <Link
            to="/khoa-hoc"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-accent-600 mb-6"
          >
            ← Về danh sách khóa học
          </Link>

          <header className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-200 text-primary-700 text-sm font-medium mb-3">
              {levelLabel(course.level)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">{course.name}</h1>
            {course.nameZh && (
              <p className="mt-2 font-chinese text-xl text-primary-600" style={{ fontFamily: 'var(--font-chinese)' }}>
                {course.nameZh}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-primary-500">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.duration} buổi
              </span>
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  ~{Math.round(totalMinutes / 60)} giờ nội dung
                </span>
              )}
              <span className="font-semibold text-accent-600">{formatCurrency(course.price ?? 0)}</span>
            </div>
          </header>

          {course.description && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-primary-900 mb-3">Giới thiệu khóa học</h2>
              <div className="text-primary-700 leading-relaxed whitespace-pre-line">{course.description}</div>
            </section>
          )}

          {course.learningObjectives && course.learningObjectives.trim() && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-primary-900 mb-3">Mục tiêu học tập</h2>
              <div
                className="prose prose-slate max-w-none text-primary-700 leading-relaxed prose-p:mb-4 prose-ul:my-3 prose-ol:my-3 prose-headings:font-semibold prose-headings:text-primary-900"
                dangerouslySetInnerHTML={{
                  __html: bodyLooksLikeHtml(course.learningObjectives)
                    ? bodyHtmlForDisplay(course.learningObjectives)
                    : plainTextToHtml(course.learningObjectives),
                }}
              />
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Nội dung khóa học ({lessons.length} bài)
            </h2>
            {lessons.length === 0 ? (
              <p className="text-primary-500">Chưa có bài học nào được xuất bản.</p>
            ) : (
              <ul className="space-y-2">
                {lessons.map((lesson, index) => (
                  <li key={lesson.id}>
                    <Link
                      to={`/khoa-hoc/${courseSlug}/bai-hoc/${lesson.slug}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-primary-100 hover:border-accent-300 hover:shadow-sm transition-all group"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-primary-900 group-hover:text-accent-600">
                          {lesson.title}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-sm text-primary-500 shrink-0">
                        {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                          <span>{lesson.durationMinutes} phút</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-primary-400 group-hover:text-accent-500" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-10 pt-8 border-t border-primary-200">
            <Link
              to="/dang-ky-hoc-thu"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-600 text-white px-6 py-3 font-medium hover:bg-accent-700 transition-colors"
            >
              Đăng ký học thử
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
