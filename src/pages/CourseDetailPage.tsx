import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Clock, ListOrdered, ArrowRight, Lock, Unlock, Send } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { useAuth } from '@/context/AuthContext';
import { useGetCourseBySlugQuery, useSubmitEnrollmentRequestMutation } from '@/store/apiSlice';
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
  const { user: me } = useAuth();
  const { data: course, isLoading, isError, error } = useGetCourseBySlugQuery(courseSlug!, { skip: !courseSlug });
  const [submitEnrollmentRequest, { isLoading: submittingRequest }] = useSubmitEnrollmentRequestMutation();
  const [requestSent, setRequestSent] = useState(false);
  const forbidden = isError && error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 403;

  if (!courseSlug || isError || (!isLoading && !course)) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          {forbidden ? (
            <p className="text-primary-600">Bạn không có quyền xem khóa học này.</p>
          ) : (
            <p className="text-primary-600">Không tìm thấy khóa học.</p>
          )}
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
            {(course as { trialExpired?: boolean }).trialExpired && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                Tài khoản học thử đã hết hạn. Vui lòng liên hệ để mua khóa học hoặc gia hạn.
              </div>
            )}
            {!course.enrolled && !(course as { trialExpired?: boolean }).trialExpired && lessons.some((l) => l.locked) && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                Một số bài học yêu cầu đăng ký khóa học để xem. Bạn có thể xem trước các bài mở miễn phí.
              </div>
            )}
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
                        {lesson.isFreePreview && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium">
                            <Unlock className="h-3.5 w-3.5" />
                            Miễn phí
                          </span>
                        )}
                        {lesson.locked && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium">
                            <Lock className="h-3.5 w-3.5" />
                            Cần đăng ký
                          </span>
                        )}
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

          <div className="mt-10 pt-8 border-t border-primary-200 space-y-4">
            {(course as { trialExpired?: boolean }).trialExpired && (
              <p className="text-primary-600 text-sm">
                Tài khoản học thử đã hết hạn (24h). Vui lòng liên hệ để mua khóa học hoặc xin gia hạn.
              </p>
            )}
            {!course.enrolled && !(course as { trialExpired?: boolean }).trialExpired && (
              <p className="text-primary-600 text-sm">
                Đăng ký khóa học để xem toàn bộ nội dung và làm bài tập. Bạn có thể gửi yêu cầu đăng ký (nếu đã đăng nhập) hoặc đăng ký học thử.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {me && !course.enrolled && (course.enrollmentRequestStatus === 'PENDING' || requestSent) && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-amber-100 text-amber-800 px-6 py-3 font-medium">
                  Đang chờ giảng viên xem xét. Bạn chưa thể gửi thêm yêu cầu cho khóa này.
                </span>
              )}
              {me && !course.enrolled && course.enrollmentRequestStatus !== 'PENDING' && !requestSent && (
                <button
                  type="button"
                  disabled={submittingRequest}
                  onClick={async () => {
                    try {
                      await submitEnrollmentRequest({ courseId: course.id }).unwrap();
                      setRequestSent(true);
                    } catch (e: unknown) {
                      const msg = e && typeof e === 'object' && 'data' in e && (e as { data?: { message?: string } }).data?.message;
                      alert(msg || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-700 text-white px-6 py-3 font-medium hover:bg-primary-800 transition-colors disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submittingRequest ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
                </button>
              )}
              {!me && (
                <Link
                  to={`/dang-ky-hoc-thu${courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-600 text-white px-6 py-3 font-medium hover:bg-accent-700 transition-colors"
                >
                  Đăng ký học thử
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {me && !course.enrolled && (
                <Link
                  to={`/dang-ky-hoc-thu${courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-300 text-primary-700 px-6 py-3 font-medium hover:bg-primary-50 transition-colors"
                >
                  Đăng ký học thử (tạo tài khoản 24h)
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
