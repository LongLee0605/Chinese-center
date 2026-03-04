import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toImageUrl } from '@/lib/api';
import Breadcrumb from '@/components/layout/Breadcrumb';
import {
  BookOpen,
  ClipboardList,
  User,
  GraduationCap,
  Award,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Vô hiệu',
  PENDING_VERIFICATION: 'Chờ xác minh',
};

export default function AccountPage() {
  const { user: me, loading: authLoading } = useAuth();

  if (authLoading || !me) {
    if (!authLoading && !me) return <Navigate to="/dang-nhap" replace />;
    return (
      <div className="container-wide px-4 py-12 flex justify-center min-h-[40vh] items-center">
        <span className="text-primary-500">Đang tải...</span>
      </div>
    );
  }

  const enrollments = me.enrollments ?? [];
  const quizAttempts = me.quizAttempts ?? [];
  const classesCurrent = me.classesCurrent ?? [];
  const classesPast = me.classesPast ?? [];
  const classesTeachingCurrent = me.classesTeachingCurrent ?? [];
  const classesTeachingPast = me.classesTeachingPast ?? [];
  const isStudent = me.role === 'STUDENT';
  const isTeacher = me.role === 'TEACHER' || me.role === 'SUPER_ADMIN';
  const statusStyle =
    me.status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-800'
      : me.status === 'PENDING_VERIFICATION'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-600';

  return (
    <div className="container-wide px-4 sm:px-6 lg:px-8 page-content">
      <Breadcrumb currentLabel="Tài khoản" />
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 mt-4">
        {/* Profile header — avatar, tên, role, status, liên hệ */}
        <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
              <div className="shrink-0">
                {me.avatar ? (
                  <img
                    src={toImageUrl(me.avatar)}
                    alt=""
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-primary-100 ring-2 ring-primary-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-100 flex items-center justify-center border border-primary-100 ${me.avatar ? 'hidden' : ''}`}
                >
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-primary-900 truncate">
                  {me.firstName} {me.lastName}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-sm font-medium">
                    {ROLE_LABEL[me.role] ?? me.role}
                  </span>
                  {me.status && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${statusStyle}`}>
                      {STATUS_LABEL[me.status] ?? me.status}
                    </span>
                  )}
                  {me.isTrial && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium">
                      <Clock size={14} />
                      Tài khoản tạm
                      {me.trialExpiresAt && (
                        <span className="opacity-90">
                          (đến {new Date(me.trialExpiresAt).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {isTeacher && (me.title || me.bio) && (
                  <p className="text-primary-600 text-sm mt-2 line-clamp-2">
                    {me.title && <span className="font-medium">{me.title}</span>}
                    {me.title && me.bio && ' · '}
                    {me.bio}
                  </p>
                )}
                <div className="mt-4 space-y-1.5 text-sm">
                  <a
                    href={`mailto:${me.email}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-accent-600 hover:underline break-all"
                  >
                    <Mail size={16} className="shrink-0 text-primary-400" />
                    {me.email}
                  </a>
                  {me.phone && (
                    <a
                      href={`tel:${me.phone}`}
                      className="flex items-center gap-2 text-primary-600 hover:text-accent-600 hover:underline"
                    >
                      <Phone size={16} className="shrink-0 text-primary-400" />
                      {me.phone}
                    </a>
                  )}
                  {me.createdAt && (
                    <p className="flex items-center gap-2 text-primary-500">
                      <Calendar size={16} className="shrink-0 text-primary-400" />
                      Tham gia từ {new Date(me.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick stats — học viên */}
        {isStudent && (enrollments.length > 0 || quizAttempts.length > 0) && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-primary-100 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
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
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
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

        {/* Lớp đang học / đã học — học viên */}
        {isStudent && (classesCurrent.length > 0 || classesPast.length > 0) && (
          <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center gap-3">
              <Users className="h-5 w-5 text-accent-600 shrink-0" />
              <h2 className="text-lg font-semibold text-primary-900">Lớp học</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              {classesCurrent.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-primary-500 mb-2">Đang học</h3>
                  <ul className="space-y-2">
                    {classesCurrent.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-primary-50 border border-primary-100">
                        <span className="font-medium text-primary-900">{c.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Mở</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {classesPast.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-primary-500 mb-2">Đã kết thúc</h3>
                  <ul className="space-y-2">
                    {classesPast.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-medium text-primary-800">{c.name}</span>
                        <span className="text-xs text-slate-500">
                          {c.closedAt ? new Date(c.closedAt).toLocaleDateString('vi-VN') : 'Đã đóng'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Lớp đang dạy / đã dạy — giảng viên */}
        {isTeacher && (classesTeachingCurrent.length > 0 || classesTeachingPast.length > 0) && (
          <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center gap-3">
              <Users className="h-5 w-5 text-accent-600 shrink-0" />
              <h2 className="text-lg font-semibold text-primary-900">Lớp phụ trách</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              {classesTeachingCurrent.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-primary-500 mb-2">Đang mở</h3>
                  <ul className="space-y-2">
                    {classesTeachingCurrent.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-primary-50 border border-primary-100">
                        <span className="font-medium text-primary-900">{c.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Mở</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {classesTeachingPast.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-primary-500 mb-2">Đã đóng</h3>
                  <ul className="space-y-2">
                    {classesTeachingPast.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-medium text-primary-800">{c.name}</span>
                        <span className="text-xs text-slate-500">
                          {c.closedAt ? new Date(c.closedAt).toLocaleDateString('vi-VN') : 'Đã đóng'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Khóa học đã đăng ký — học viên */}
        {isStudent && (
          <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-accent-600 shrink-0" />
                <h2 className="text-lg font-semibold text-primary-900">Khóa học đã đăng ký</h2>
              </div>
              {enrollments.length > 0 && (
                <Link to="/khoa-hoc" className="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1">
                  Xem tất cả <ChevronRight size={16} />
                </Link>
              )}
            </div>
            <div className="p-5 sm:p-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-7 h-7 text-primary-400" />
                  </div>
                  <p className="text-primary-600 font-medium">Bạn chưa đăng ký khóa học nào</p>
                  <p className="text-primary-500 text-sm mt-1">Khám phá các khóa học phù hợp với bạn</p>
                  <Link
                    to="/khoa-hoc"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                  >
                    Xem khóa học <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {enrollments.map((e) => (
                    <li
                      key={e.courseId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-200 transition-colors"
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
                          className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
                        >
                          Vào học <ChevronRight size={16} />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Kết quả bài test — học viên */}
        {isStudent && (
          <section className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-primary-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-accent-600 shrink-0" />
                <h2 className="text-lg font-semibold text-primary-900">Kết quả bài test</h2>
              </div>
              {quizAttempts.length > 0 && (
                <Link to="/bai-test" className="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1">
                  Xem bài test <ChevronRight size={16} />
                </Link>
              )}
            </div>
            <div className="p-5 sm:p-6">
              {quizAttempts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-7 h-7 text-amber-500" />
                  </div>
                  <p className="text-primary-600 font-medium">Bạn chưa làm bài test nào</p>
                  <p className="text-primary-500 text-sm mt-1">Làm bài test để kiểm tra trình độ</p>
                  <Link
                    to="/bai-test"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                  >
                    Xem bài test <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {quizAttempts.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl border border-primary-100 hover:bg-primary-50/50 transition-colors last:border-b"
                    >
                      <span className="font-medium text-primary-900">{a.quizTitle}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-primary-600">
                          Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}
                        </span>
                        {a.quizSlug && (
                          <Link
                            to={`/bai-test/${a.quizSlug}`}
                            className="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-0.5"
                          >
                            Xem lại <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
