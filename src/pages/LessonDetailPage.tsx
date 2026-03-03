import { useParams, Link } from 'react-router-dom';
import { Clock, FileText, Video, ChevronLeft, ChevronRight, BookOpen, ClipboardList, Lock } from 'lucide-react';
import { useGetCourseBySlugQuery } from '@/store/apiSlice';
import { useAuth } from '@/context/AuthContext';
import { bodyHtmlForDisplay } from '@/lib/api';
import { bodyLooksLikeHtml, plainTextToHtml } from '@/lib/utils';
import { normalizeLessonVideoUrl } from '@/lib/videoUrl';
import LessonQuizForm from '@/components/lesson/LessonQuizForm';

export default function LessonDetailPage() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  const { user: authUser } = useAuth();
  const { data: course, isLoading, isError, error } = useGetCourseBySlugQuery(courseSlug!, { skip: !courseSlug });
  const forbidden = isError && error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 403;

  const lessons = course?.lessons ?? [];
  const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug);
  const lesson = currentIndex >= 0 ? lessons[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const locked = !!lesson?.locked;
  const hasContent = !!lesson?.content?.trim();
  const hasVideo = !!lesson?.videoUrl?.trim();
  const lessonQuiz = lesson?.quizzes?.[0];
  const hasQuiz = !!lessonQuiz && (lessonQuiz.questions?.length ?? 0) > 0;

  if (!courseSlug || !lessonSlug || isError || (!isLoading && !course)) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          {forbidden ? (
            <p className="text-primary-600">Bạn không có quyền xem bài học này.</p>
          ) : (
            <p className="text-primary-600">Không tìm thấy bài học.</p>
          )}
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

  return (
    <div className="min-h-screen bg-primary-50">
      <article>
        <div className="container-wide px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <nav className="flex items-center gap-2 text-sm text-primary-600 mb-6">
            <Link to="/khoa-hoc" className="hover:text-accent-600">Khóa học</Link>
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
              {locked && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-sm">
                  <Lock className="h-4 w-4" />
                  Cần đăng ký khóa học
                </span>
              )}
              {!locked && hasContent && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm">
                  <FileText className="h-4 w-4" />
                  Tài liệu
                </span>
              )}
              {!locked && hasVideo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm">
                  <Video className="h-4 w-4" />
                  Video
                </span>
              )}
              {!locked && hasQuiz && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm">
                  <ClipboardList className="h-4 w-4" />
                  Bài tập
                </span>
              )}
              {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-600 text-sm">
                  <Clock className="h-4 w-4" />
                  {lesson.durationMinutes} phút
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">{lesson.title}</h1>
          </header>

          {locked ? (
            <section className="mb-8 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 sm:p-10 text-center">
              <Lock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-amber-900 mb-2">
                {(course as { trialExpired?: boolean }).trialExpired
                  ? 'Tài khoản học thử đã hết hạn'
                  : 'Nội dung bài học yêu cầu đăng ký khóa học'}
              </h2>
              <p className="text-amber-800 text-sm mb-6 max-w-md mx-auto">
                {(course as { trialExpired?: boolean }).trialExpired
                  ? 'Tài khoản xem thử 24h đã hết hạn. Vui lòng liên hệ để mua khóa học hoặc xin gia hạn.'
                  : <>Bạn cần đăng ký khóa học <strong>{course.name}</strong> để xem toàn bộ tài liệu, video và làm bài tập. Liên hệ với chúng tôi hoặc đăng ký học thử để được tư vấn.</>}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to={`/khoa-hoc/${courseSlug}`}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-600 text-amber-800 px-5 py-2.5 font-medium hover:bg-amber-100 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Về trang khóa học
                </Link>
                <Link
                  to="/dang-ky-hoc-thu"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-5 py-2.5 font-medium hover:bg-amber-700 transition-colors"
                >
                  Đăng ký học thử / Liên hệ
                </Link>
              </div>
            </section>
          ) : (
            <>
          {/* 1. Tài liệu */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-600" />
              Tài liệu
            </h2>
            {hasContent ? (
              <div
                className="prose prose-slate max-w-none text-primary-700 leading-relaxed prose-p:mb-4 prose-ul:my-3 prose-ol:my-3 prose-headings:font-semibold prose-headings:text-primary-900 prose-a:text-accent-600 prose-img:rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: bodyLooksLikeHtml(lesson.content!)
                    ? bodyHtmlForDisplay(lesson.content!)
                    : plainTextToHtml(lesson.content!),
                }}
              />
            ) : (
              <p className="text-primary-500 italic">Nội dung tài liệu đang được cập nhật.</p>
            )}
          </section>

          {/* 2. Video */}
          {hasVideo && (() => {
            const videoDisplay = normalizeLessonVideoUrl(lesson.videoUrl!);
            if (!videoDisplay) return null;
            return (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-accent-600" />
                  Video bài giảng
                </h2>
                <div className="rounded-xl overflow-hidden bg-primary-900 aspect-video">
                  {videoDisplay.type === 'video' ? (
                    <video
                      src={videoDisplay.url}
                      title={lesson.title}
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                    />
                  ) : (
                    <iframe
                      src={videoDisplay.url}
                      title={lesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </section>
            );
          })()}

          {/* 3. Bài tập (quiz gắn với bài học) */}
          {hasQuiz && lessonQuiz && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent-600" />
                Bài tập
              </h2>
              <div className="rounded-2xl border border-primary-200 bg-white p-6 sm:p-8">
                <LessonQuizForm
                  quiz={{
                    id: lessonQuiz.id,
                    title: lessonQuiz.title,
                    description: lessonQuiz.description ?? null,
                    questions: lessonQuiz.questions ?? [],
                  }}
                  isLoggedIn={!!authUser}
                />
              </div>
            </section>
          )}

          </>
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
