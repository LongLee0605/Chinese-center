import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi, type UserAccount, type UserRole } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Pencil, BookOpen, ClipboardList, User, Mail, Phone, GraduationCap, Clock } from 'lucide-react';
import { avatarUrl } from '../../api/client';

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEACHER: 'Giảng viên',
  STUDENT: 'Học viên',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Vô hiệu',
  PENDING_VERIFICATION: 'Chờ xác minh',
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  INACTIVE: 'bg-slate-100 text-slate-600',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
};

type Enrollment = {
  courseId: string;
  courseName: string;
  courseSlug: string;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  percentProgress: number;
};

type QuizAttemptItem = {
  id: string;
  quizId: string;
  quizTitle: string;
  quizSlug: string;
  score: number | null;
  submittedAt: string | null;
};

type ClassItem = { id: string; name: string; status: string; closedAt?: string };

type UserDetail = UserAccount & {
  enrollments?: Enrollment[];
  quizAttempts?: QuizAttemptItem[];
  classesCurrent?: ClassItem[];
  classesPast?: ClassItem[];
  classesTeachingCurrent?: ClassItem[];
  classesTeachingPast?: ClassItem[];
};

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    usersApi
      .get(id)
      .then((u) => setUser(u as UserDetail))
      .catch((e) => {
        show('error', e?.message || 'Không tải được thông tin');
        navigate('/accounts');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, show]);

  if (loading || !user) {
    return (
      <div className="crm-page flex items-center justify-center min-h-[280px]">
        <span className="text-slate-500">Đang tải...</span>
      </div>
    );
  }

  const detail = user as UserDetail;
  const enrollments = detail.enrollments ?? [];
  const quizAttempts = detail.quizAttempts ?? [];
  const classesCurrent = detail.classesCurrent ?? [];
  const classesPast = detail.classesPast ?? [];
  const classesTeachingCurrent = detail.classesTeachingCurrent ?? [];
  const classesTeachingPast = detail.classesTeachingPast ?? [];
  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const teacherUser = user as UserDetail & { title?: string; bio?: string; avatar?: string; specializations?: string[]; yearsExperience?: number; teacherPublic?: boolean; teacherOrderIndex?: number };
  const statusStyle = STATUS_STYLE[user.status] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="crm-page max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link to="/accounts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 hover:underline">
          <ArrowLeft size={18} />
          Danh sách tài khoản
        </Link>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link
            to={`/accounts/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            <Pencil size={16} />
            Sửa tài khoản
          </Link>
        )}
      </div>

      {/* Profile card — giống admin profile/detail trên thị trường */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-6 sm:gap-8 items-start">
            <div className="shrink-0">
              {user.avatar ? (
                <img
                  src={avatarUrl(user.avatar)}
                  alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 ${user.avatar ? 'hidden' : ''}`}
              >
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                  {ROLE_LABEL[user.role]}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${statusStyle}`}>
                  {STATUS_LABEL[user.status] ?? user.status}
                </span>
                {user.isTrial && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium">
                    <Clock size={14} />
                    Tạm thời
                    {user.trialExpiresAt && (
                      <span className="opacity-90">
                        (hết hạn {new Date(user.trialExpiresAt).toLocaleString('vi-VN')})
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:underline break-all"
                >
                  <Mail size={16} className="shrink-0 text-slate-400" />
                  {user.email}
                </a>
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    <Phone size={16} className="shrink-0 text-slate-400" />
                    {user.phone}
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Tham gia từ {user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '—'}
              </p>
            </div>
          </div>

          {isTeacher && (classesTeachingCurrent.length > 0 || classesTeachingPast.length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lớp đang dạy</p>
              {classesTeachingCurrent.length === 0 ? (
                <p className="text-sm text-slate-500">Không có</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {classesTeachingCurrent.map((c) => (
                    <li key={c.id}>
                      <Link to={`/classes/${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm hover:bg-slate-200">
                        <GraduationCap size={14} /> {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {classesTeachingPast.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">Lớp từng dạy</p>
                  <ul className="flex flex-wrap gap-2">
                    {classesTeachingPast.map((c) => (
                      <li key={c.id}>
                        <Link to={`/classes/${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-sm border border-slate-100">
                          <GraduationCap size={14} /> {c.name}
                          {c.closedAt && <span className="text-xs text-slate-400">(đóng {new Date(c.closedAt).toLocaleDateString('vi-VN')})</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {isTeacher && (teacherUser.title || teacherUser.bio || teacherUser.avatar) && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thông tin đội ngũ (website)</p>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {teacherUser.avatar && (
                  <img
                    src={avatarUrl(teacherUser.avatar)}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="text-sm text-slate-600 space-y-1 min-w-0">
                  {teacherUser.title && <p><span className="font-medium text-slate-700">Chức danh:</span> {teacherUser.title}</p>}
                  {teacherUser.bio && <p className="whitespace-pre-wrap">{teacherUser.bio}</p>}
                  {(teacherUser.specializations?.length ?? 0) > 0 && (
                    <p><span className="font-medium text-slate-700">Chuyên môn:</span> {teacherUser.specializations!.join(', ')}</p>
                  )}
                  {teacherUser.yearsExperience != null && (
                    <p><span className="font-medium text-slate-700">Kinh nghiệm:</span> {teacherUser.yearsExperience} năm</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isStudent && (
        <>
          {(classesCurrent.length > 0 || classesPast.length > 0) && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <GraduationCap size={20} className="text-slate-600 shrink-0" />
                <h2 className="text-lg font-semibold text-slate-900">Lớp học</h2>
              </div>
              <div className="crm-card-padding">
                {classesCurrent.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-slate-700 mb-2">Lớp đang học</p>
                    <ul className="flex flex-wrap gap-2 mb-4">
                      {classesCurrent.map((c) => (
                        <li key={c.id}>
                          <Link to={`/classes/${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-sm hover:bg-emerald-100">
                            <GraduationCap size={14} /> {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {classesPast.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-slate-700 mb-2">Lớp từng học</p>
                    <ul className="flex flex-wrap gap-2">
                      {classesPast.map((c) => (
                        <li key={c.id}>
                          <Link to={`/classes/${c.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-sm border border-slate-100">
                            <GraduationCap size={14} /> {c.name}
                            {c.closedAt && <span className="text-xs text-slate-400">(đóng {new Date(c.closedAt).toLocaleDateString('vi-VN')})</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          )}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <BookOpen size={20} className="text-slate-600 shrink-0" />
              <h2 className="text-lg font-semibold text-slate-900">Khóa học đã mua / đăng ký</h2>
            </div>
            <div className="crm-card-padding">
              {enrollments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Chưa đăng ký khóa học nào</p>
                  <p className="text-slate-500 text-sm mt-1">Học viên chưa có khóa học trong hệ thống</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {enrollments.map((e) => (
                    <li
                      key={e.courseId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/courses/${e.courseId}`}
                          className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                        >
                          {e.courseName}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Đăng ký: {new Date(e.enrolledAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium text-slate-700">
                          {e.completedLessons}/{e.totalLessons} bài ({e.percentProgress}%)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <ClipboardList size={20} className="text-slate-600 shrink-0" />
              <h2 className="text-lg font-semibold text-slate-900">Kết quả bài test đã làm</h2>
            </div>
            <div className="crm-card-padding">
              {quizAttempts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Chưa làm bài test nào</p>
                  <p className="text-slate-500 text-sm mt-1">Chưa có lịch sử làm bài test</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {quizAttempts.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-900">{a.quizTitle}</span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-600">
                          Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN') : '—'}
                        </span>
                        <Link
                          to={`/quizzes/attempt/${a.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Xem chi tiết đúng/sai
                        </Link>
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
  );
}
