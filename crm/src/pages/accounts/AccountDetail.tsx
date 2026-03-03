import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi, type UserAccount, type UserRole } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Pencil, BookOpen, ClipboardList } from 'lucide-react';
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

type UserDetail = UserAccount & {
  enrollments?: Enrollment[];
  quizAttempts?: QuizAttemptItem[];
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
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <span className="text-slate-500">Đang tải...</span>
      </div>
    );
  }

  const enrollments = (user as UserDetail).enrollments ?? [];
  const quizAttempts = (user as UserDetail).quizAttempts ?? [];
  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const teacherUser = user as UserDetail & { title?: string; bio?: string; avatar?: string; specializations?: string[]; yearsExperience?: number; teacherPublic?: boolean; teacherOrderIndex?: number };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link to="/accounts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:underline">
          <ArrowLeft size={18} />
          Danh sách tài khoản
        </Link>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link
            to={`/accounts/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
          >
            <Pencil size={16} />
            Sửa tài khoản
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-slate-600 mt-1">{user.email}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {ROLE_LABEL[user.role]}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {STATUS_LABEL[user.status] ?? user.status}
            </span>
            {user.phone && (
              <span className="text-slate-600">Điện thoại: {user.phone}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tạo lúc: {user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '—'}
          </p>
          {isTeacher && (teacherUser.title || teacherUser.bio || teacherUser.avatar) && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Thông tin đội ngũ (website)</p>
              <div className="flex gap-4">
                {teacherUser.avatar && (
                  <img src={avatarUrl(teacherUser.avatar)} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div className="text-sm text-slate-600">
                  {teacherUser.title && <p><span className="font-medium">Chức danh:</span> {teacherUser.title}</p>}
                  {teacherUser.bio && <p className="mt-1 whitespace-pre-wrap">{teacherUser.bio}</p>}
                  {(teacherUser.specializations?.length ?? 0) > 0 && (
                    <p className="mt-1"><span className="font-medium">Chuyên môn:</span> {teacherUser.specializations!.join(', ')}</p>
                  )}
                  {teacherUser.yearsExperience != null && <p><span className="font-medium">Kinh nghiệm:</span> {teacherUser.yearsExperience} năm</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isStudent && (
        <>
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen size={20} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Khóa học đã mua / đăng ký</h2>
            </div>
            <div className="p-6">
              {enrollments.length === 0 ? (
                <p className="text-slate-500 text-sm">Chưa đăng ký khóa học nào.</p>
              ) : (
                <ul className="space-y-4">
                  {enrollments.map((e) => (
                    <li
                      key={e.courseId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div>
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
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-700">
                          Đã học: {e.completedLessons}/{e.totalLessons} bài ({e.percentProgress}%)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <ClipboardList size={20} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Kết quả bài test đã làm</h2>
            </div>
            <div className="p-6">
              {quizAttempts.length === 0 ? (
                <p className="text-slate-500 text-sm">Chưa làm bài test nào.</p>
              ) : (
                <ul className="space-y-3">
                  {quizAttempts.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-900">{a.quizTitle}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">
                          Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleString('vi-VN')
                            : '—'}
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
