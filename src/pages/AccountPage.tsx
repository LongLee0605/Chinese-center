import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGetMeQuery } from '@/store/apiSlice';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList } from 'lucide-react';

export default function AccountPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { data: me, isLoading } = useGetMeQuery(undefined, { skip: !authUser });

  if (authLoading || !authUser) {
    if (!authLoading && !authUser) return <Navigate to="/dang-nhap" replace />;
    return (
      <div className="container-wide px-4 py-12 flex justify-center">
        <span className="text-primary-500">Đang tải...</span>
      </div>
    );
  }

  if (isLoading || !me) {
    return (
      <div className="container-wide px-4 py-12 flex justify-center">
        <span className="text-primary-500">Đang tải thông tin tài khoản...</span>
      </div>
    );
  }

  const enrollments = me.enrollments ?? [];
  const quizAttempts = me.quizAttempts ?? [];
  const isStudent = me.role === 'STUDENT';

  return (
    <div className="container-wide px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 mb-2">
          Thông tin tài khoản
        </h1>
        <p className="text-primary-600 mb-8">
          Xem thông tin cá nhân và tiến độ học tập của bạn.
        </p>

        <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-primary-100">
            <h2 className="text-lg font-semibold text-primary-900 mb-3">Thông tin cá nhân</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-primary-500">Họ và tên</dt>
                <dd className="font-medium text-primary-900">{me.firstName} {me.lastName}</dd>
              </div>
              <div>
                <dt className="text-primary-500">Email</dt>
                <dd className="font-medium text-primary-900">{me.email}</dd>
              </div>
              {me.phone && (
                <div>
                  <dt className="text-primary-500">Điện thoại</dt>
                  <dd className="font-medium text-primary-900">{me.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {isStudent && (
          <>
            <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent-600" />
                <h2 className="text-lg font-semibold text-primary-900">Khóa học đã đăng ký</h2>
              </div>
              <div className="p-6">
                {enrollments.length === 0 ? (
                  <p className="text-primary-500 text-sm">Bạn chưa đăng ký khóa học nào.</p>
                ) : (
                  <ul className="space-y-4">
                    {enrollments.map((e) => (
                      <li
                        key={e.courseId}
                        className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100"
                      >
                        <Link
                          to={`/khoa-hoc/${e.courseSlug}`}
                          className="font-medium text-primary-900 hover:text-accent-600 hover:underline"
                        >
                          {e.courseName}
                        </Link>
                        <span className="text-sm text-primary-600">
                          Đã học {e.completedLessons}/{e.totalLessons} bài ({e.percentProgress}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-primary-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent-600" />
                <h2 className="text-lg font-semibold text-primary-900">Kết quả bài test</h2>
              </div>
              <div className="p-6">
                {quizAttempts.length === 0 ? (
                  <p className="text-primary-500 text-sm">Bạn chưa làm bài test nào.</p>
                ) : (
                  <ul className="space-y-3">
                    {quizAttempts.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-primary-100 last:border-0"
                      >
                        <span className="font-medium text-primary-900">{a.quizTitle}</span>
                        <span className="text-sm text-primary-600">
                          Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
