import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGetMeQuery } from '@/store/apiSlice';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, User, GraduationCap, Award } from 'lucide-react';

export default function AccountPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { data: me, isLoading } = useGetMeQuery(undefined, { skip: !authUser });

  if (authLoading || !authUser) {
    if (!authLoading && !authUser) return <Navigate to="/dang-nhap" replace />;
    return (
      <div className="container-wide px-4 py-12 flex justify-center min-h-[40vh] items-center">
        <span className="text-primary-500">Đang tải...</span>
      </div>
    );
  }

  if (isLoading || !me) {
    return (
      <div className="container-wide px-4 py-12 flex justify-center min-h-[40vh] items-center">
        <span className="text-primary-500">Đang tải thông tin tài khoản...</span>
      </div>
    );
  }

  const enrollments = me.enrollments ?? [];
  const quizAttempts = me.quizAttempts ?? [];
  const isStudent = me.role === 'STUDENT';

  return (
    <div className="container-wide px-4 sm:px-6 lg:px-8 page-content">
      <div className="max-w-2xl mx-auto">
        {/* Profile header card — giống các trang profile phổ biến */}
        <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-100 flex items-center justify-center">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary-400" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-primary-900 truncate">
                  {me.firstName} {me.lastName}
                </h1>
                <p className="text-primary-600 mt-0.5 break-all">{me.email}</p>
                {me.phone && (
                  <p className="text-primary-600 text-sm mt-1">
                    <a href={`tel:${me.phone}`} className="hover:text-accent-600 hover:underline">
                      {me.phone}
                    </a>
                  </p>
                )}
                <p className="text-primary-500 text-sm mt-2">
                  Tài khoản học viên · Xem thông tin và tiến độ học tập
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick stats — chỉ hiện khi là student và có dữ liệu */}
        {isStudent && (enrollments.length > 0 || quizAttempts.length > 0) && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl border border-primary-100 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-900">{enrollments.length}</p>
                  <p className="text-sm text-primary-600">Khóa học đã đăng ký</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-primary-100 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-900">{quizAttempts.length}</p>
                  <p className="text-sm text-primary-600">Bài test đã làm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin cá nhân — gọn, dạng definition list */}
        <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
          <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center gap-3">
            <User className="h-5 w-5 text-accent-600 shrink-0" />
            <h2 className="text-lg font-semibold text-primary-900">Thông tin cá nhân</h2>
          </div>
          <div className="p-5 sm:p-6">
            <dl className="grid gap-4 sm:grid-cols-1">
              <div>
                <dt className="text-primary-500 text-sm">Họ và tên</dt>
                <dd className="font-medium text-primary-900 mt-0.5">{me.firstName} {me.lastName}</dd>
              </div>
              <div>
                <dt className="text-primary-500 text-sm">Email</dt>
                <dd className="font-medium text-primary-900 mt-0.5 break-all">{me.email}</dd>
              </div>
              {me.phone && (
                <div>
                  <dt className="text-primary-500 text-sm">Điện thoại</dt>
                  <dd className="font-medium text-primary-900 mt-0.5">
                    <a href={`tel:${me.phone}`} className="hover:text-accent-600 hover:underline">{me.phone}</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {isStudent && (
          <>
            <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
              <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-accent-600 shrink-0" />
                <h2 className="text-lg font-semibold text-primary-900">Khóa học đã đăng ký</h2>
              </div>
              <div className="p-5 sm:p-6">
                {enrollments.length === 0 ? (
                  <div className="text-center py-8 sm:py-10">
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-7 h-7 text-primary-400" />
                    </div>
                    <p className="text-primary-600 font-medium">Bạn chưa đăng ký khóa học nào</p>
                    <p className="text-primary-500 text-sm mt-1">Khám phá các khóa học phù hợp với bạn</p>
                    <Link
                      to="/khoa-hoc"
                      className="inline-block mt-4 px-5 py-2.5 rounded-lg font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                    >
                      Xem khóa học
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {enrollments.map((e) => (
                      <li
                        key={e.courseId}
                        className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-200 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/khoa-hoc/${e.courseSlug}`}
                            className="font-medium text-primary-900 hover:text-accent-600 hover:underline block truncate"
                          >
                            {e.courseName}
                          </Link>
                          <p className="text-xs text-primary-500 mt-0.5">
                            Đăng ký: {new Date(e.enrolledAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-medium text-primary-700">
                              {e.completedLessons}/{e.totalLessons} bài
                            </span>
                            <span className="text-primary-500 text-sm ml-1">({e.percentProgress}%)</span>
                          </div>
                          <Link
                            to={`/khoa-hoc/${e.courseSlug}`}
                            className="text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
                          >
                            Vào học
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
              <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-accent-600 shrink-0" />
                <h2 className="text-lg font-semibold text-primary-900">Kết quả bài test</h2>
              </div>
              <div className="p-5 sm:p-6">
                {quizAttempts.length === 0 ? (
                  <div className="text-center py-8 sm:py-10">
                    <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-7 h-7 text-amber-500" />
                    </div>
                    <p className="text-primary-600 font-medium">Bạn chưa làm bài test nào</p>
                    <p className="text-primary-500 text-sm mt-1">Làm bài test để kiểm tra trình độ</p>
                    <Link
                      to="/bai-test"
                      className="inline-block mt-4 px-5 py-2.5 rounded-lg font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                    >
                      Xem bài test
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2 sm:space-y-3">
                    {quizAttempts.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4 border-b border-primary-100 last:border-0"
                      >
                        <span className="font-medium text-primary-900">{a.quizTitle}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-primary-600">
                            Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}
                          </span>
                          {a.quizSlug && (
                            <Link
                              to={`/bai-test/${a.quizSlug}`}
                              className="text-sm text-accent-600 hover:underline"
                            >
                              Xem lại
                            </Link>
                          )}
                        </div>
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
