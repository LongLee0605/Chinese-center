import { useParams, Link } from 'react-router-dom';
import { Clock, FileText, Video, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useGetCourseBySlugQuery } from '@/store/apiSlice';
import { bodyHtmlForDisplay } from '@/lib/api';
import { bodyLooksLikeHtml, plainTextToHtml } from '@/lib/utils';

const LESSON_TYPE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  DOCUMENT: { label: 'Tài liệu', icon: FileText },
  VIDEO: { label: 'Video', icon: Video },
  QUIZ: { label: 'Bài tập', icon: FileText },
};

export default function LessonDetailPage() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  const { data: course, isLoading, isError } = useGetCourseBySlugQuery(courseSlug!, { skip: !courseSlug });

  const lessons = course?.lessons ?? [];
  const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug);
  const lesson = currentIndex >= 0 ? lessons[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (!courseSlug || !lessonSlug || isError || (!isLoading && !course)) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          <p className="text-primary-600">Không tìm thấy bài học.</p>
          <Link to="/khoa-hoc" className="mt-4 inline-block text-accent-600 font-medium">
            ← Về khóa học
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          <p className="text-primary-600">Không tìm thấy bài học này trong khóa.</p>
          <Link to={`/khoa-hoc/${courseSlug}`} className="mt-4 inline-block text-accent-600 font-medium">
            ← Về {course.name}
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = LESSON_TYPE_LABELS[lesson.type] ?? { label: lesson.type, icon: FileText };
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-primary-50">
      <article className="">
        <div className="container-wide px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <nav className="flex items-center gap-2 text-sm text-primary-600 mb-6">
            <Link to="/khoa-hoc" className="hover:text-accent-600">
              Khóa học
            </Link>
            <span>/</span>
            <Link to={`/khoa-hoc/${courseSlug}`} className="hover:text-accent-600 flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-primary-900">{lesson.title}</span>
          </nav>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm">
                <TypeIcon className="h-4 w-4" />
                {typeInfo.label}
              </span>
              {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-600 text-sm">
                  <Clock className="h-4 w-4" />
                  {lesson.durationMinutes} phút
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">{lesson.title}</h1>
          </header>

          {lesson.type === 'VIDEO' && lesson.videoUrl && (
            <section className="mb-8 rounded-xl overflow-hidden bg-primary-900 aspect-video">
              <iframe
                src={lesson.videoUrl}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </section>
          )}

          {lesson.content && (
            <section
              className="prose prose-slate max-w-none text-primary-700 leading-relaxed prose-p:mb-4 prose-ul:my-3 prose-ol:my-3 prose-headings:font-semibold prose-headings:text-primary-900 prose-a:text-accent-600 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{
                __html: bodyLooksLikeHtml(lesson.content)
                  ? bodyHtmlForDisplay(lesson.content)
                  : plainTextToHtml(lesson.content),
              }}
            />
          )}

          {!lesson.content && lesson.type !== 'VIDEO' && (
            <p className="text-primary-500 italic">Nội dung bài học đang được cập nhật.</p>
          )}

          <nav
            className="mt-10 pt-8 border-t border-primary-200 flex flex-wrap items-center justify-between gap-4"
            aria-label="Điều hướng bài học"
          >
            {prevLesson ? (
              <Link
                to={`/khoa-hoc/${courseSlug}/bai-hoc/${prevLesson.slug}`}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-accent-600 font-medium"
              >
                <ChevronLeft className="h-5 w-5" />
                {prevLesson.title}
              </Link>
            ) : (
              <span />
            )}
            <Link
              to={`/khoa-hoc/${courseSlug}`}
              className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-accent-600"
            >
              <BookOpen className="h-4 w-4" />
              Mục lục khóa học
            </Link>
            {nextLesson ? (
              <Link
                to={`/khoa-hoc/${courseSlug}/bai-hoc/${nextLesson.slug}`}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-accent-600 font-medium text-right max-w-[50%]"
              >
                {nextLesson.title}
                <ChevronRight className="h-5 w-5 shrink-0" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </article>
    </div>
  );
}
