import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesApi, lessonsApi, quizzesApi, usersApi, enrollmentRequestsApi, bodyHtmlForDisplay, bodyHtmlForSave } from '../../api/client';
import type { EnrollmentRequest } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import RichTextEditor from '../../components/RichTextEditor';
import { Plus, Pencil, Trash2, ArrowLeft, BookOpen, Video, FileText, ClipboardList, ChevronUp, ChevronDown, ExternalLink, UserPlus, Unlock, Send, Check, X } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
  type: string;
  durationMinutes?: number | null;
  isPublished: boolean;
  isFreePreview?: boolean;
};

type Course = {
  id: string;
  name: string;
  code: string;
  level?: string;
  duration?: number;
  price?: number;
  currency?: string;
  description?: string | null;
  learningObjectives?: string | null;
  status?: string;
  lessons: Lesson[];
};

const INITIAL_LESSON_FORM = {
  title: '',
  slug: '',
  orderIndex: 0,
  content: '',
  durationMinutes: 0,
  type: 'DOCUMENT',
  videoUrl: '',
  isPublished: false,
  isFreePreview: false,
};

function LessonTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'VIDEO':
      return <Video size={18} className="text-blue-600 shrink-0" />;
    case 'QUIZ':
      return <ClipboardList size={18} className="text-amber-600 shrink-0" />;
    default:
      return <FileText size={18} className="text-gray-600 shrink-0" />;
  }
}

function lessonTypeLabel(type: string): string {
  switch (type) {
    case 'VIDEO': return 'Video';
    case 'QUIZ': return 'Bài test';
    default: return 'Tài liệu';
  }
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'bai-hoc';
}

function formatPrice(price: number, currency?: string): string {
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN').format(Number(price)) + ' ₫';
  return `${price} ${currency ?? 'VND'}`;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState(INITIAL_LESSON_FORM);
  const [reordering, setReordering] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonQuizzes, setLessonQuizzes] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [loadingLessonQuizzes, setLoadingLessonQuizzes] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [enrollments, setEnrollments] = useState<Array<{ id: string; userId: string; enrolledAt: string; user: { id: string; email: string; firstName: string; lastName: string } }>>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const [usersForEnroll, setUsersForEnroll] = useState<Array<{ id: string; email: string; firstName: string; lastName: string }>>([]);
  const [selectedUserIdForEnroll, setSelectedUserIdForEnroll] = useState('');
  const [addingEnrollment, setAddingEnrollment] = useState(false);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [loadingEnrollmentRequests, setLoadingEnrollmentRequests] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);

  const loadCourse = useCallback(() => {
    if (!id) return;
    coursesApi
      .get(id)
      .then((raw: unknown) => setCourse(raw as Course))
      .catch(() => show('error', 'Không tải được khóa học.'));
  }, [id, show]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (!id) return;
    setLoadingEnrollments(true);
    coursesApi
      .getEnrollments(id)
      .then((list) => setEnrollments(list as typeof enrollments))
      .catch(() => setEnrollments([]))
      .finally(() => setLoadingEnrollments(false));
  }, [id, course]);

  useEffect(() => {
    if (!id) return;
    setLoadingEnrollmentRequests(true);
    enrollmentRequestsApi
      .list({ courseId: id, limit: 100 })
      .then((r) => setEnrollmentRequests(r.items))
      .catch(() => setEnrollmentRequests([]))
      .finally(() => setLoadingEnrollmentRequests(false));
  }, [id]);

  useEffect(() => {
    if (showAddEnrollment && usersForEnroll.length === 0) {
      usersApi
        .list({ limit: 500 })
        .then((r: { items: unknown[] }) => setUsersForEnroll((r.items as typeof usersForEnroll) ?? []))
        .catch(() => setUsersForEnroll([]));
    }
  }, [showAddEnrollment, usersForEnroll.length]);

  function openNew() {
    setEditingLesson(null);
    setLessonQuizzes([]);
    setForm({ ...INITIAL_LESSON_FORM, orderIndex: course?.lessons?.length ?? 0 });
    setShowLessonForm(true);
  }

  async function handleCreateLessonQuiz() {
    if (!editingLesson || !id) return;
    setCreatingQuiz(true);
    try {
      const slug = `bt-${(form.slug || 'bai').replace(/[^a-z0-9-]/gi, '-')}-${Date.now().toString(36)}`;
      const q = await quizzesApi.create({
        title: `Bài tập - ${form.title || editingLesson.title}`,
        slug,
        courseId: id,
        lessonId: editingLesson.id,
        isPublished: false,
        quizType: 'MIXED',
      }) as { id: string };
      show('success', 'Đã tạo bài tập. Chuyển đến trang thêm câu hỏi.');
      navigate(`/quizzes/${q.id}`, { replace: false });
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Tạo bài tập thất bại.');
    } finally {
      setCreatingQuiz(false);
    }
  }

  function openEdit(lesson: Lesson) {
    setEditingLesson(lesson);
    setLessonQuizzes([]);
    lessonsApi
      .get(lesson.id)
      .then((raw: unknown) => {
        const l = raw as Record<string, unknown>;
        setForm({
          title: String(l.title ?? ''),
          slug: String(l.slug ?? ''),
          orderIndex: Number(l.orderIndex) ?? 0,
          content: bodyHtmlForDisplay(String(l.content ?? '')),
          durationMinutes: Number(l.durationMinutes) ?? 0,
          type: String(l.type ?? 'DOCUMENT'),
          videoUrl: String(l.videoUrl ?? ''),
          isPublished: Boolean(l.isPublished),
          isFreePreview: Boolean(l.isFreePreview),
        });
      })
      .catch(() => show('error', 'Không tải được bài học.'));
    setShowLessonForm(true);
    setLoadingLessonQuizzes(true);
    quizzesApi
      .list({ lessonId: lesson.id, limit: 50 })
      .then((r: { items: unknown[] }) => setLessonQuizzes((r.items as { id: string; title: string; slug: string }[]) ?? []))
      .catch(() => setLessonQuizzes([]))
      .finally(() => setLoadingLessonQuizzes(false));
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim() || slugify(title);
    if (!title) {
      show('error', 'Vui lòng nhập tiêu đề bài học.');
      return;
    }
    if (!id) {
      show('error', 'Không xác định được khóa học.');
      return;
    }
    const payload = {
      title,
      slug,
      orderIndex: Number(form.orderIndex) ?? 0,
      content: bodyHtmlForSave(form.content || '') || undefined,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      type: form.type as 'DOCUMENT' | 'VIDEO' | 'QUIZ',
      videoUrl: form.videoUrl?.trim() || undefined,
      isPublished: Boolean(form.isPublished),
      isFreePreview: Boolean(form.isFreePreview),
    };
    setSavingLesson(true);
    try {
      if (editingLesson) {
        await lessonsApi.update(editingLesson.id, payload);
        show('success', 'Đã sửa bài học.');
      } else {
        await lessonsApi.create({ ...payload, courseId: id });
        show('success', 'Đã thêm bài học.');
      }
      setShowLessonForm(false);
      loadCourse();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lưu thất bại. Kiểm tra slug không trùng trong khóa.';
      show('error', message);
    } finally {
      setSavingLesson(false);
    }
  }

  async function removeLesson(lessonId: string) {
    if (!confirm('Xóa bài học này?')) return;
    try {
      await lessonsApi.delete(lessonId);
      loadCourse();
      show('success', 'Đã xóa bài học.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  }

  async function moveLesson(lessonId: string, direction: 'up' | 'down') {
    const list = course?.lessons ?? [];
    const idx = list.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    const reordered = [...list];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setReordering(true);
    try {
      await lessonsApi.reorder(id!, reordered.map((l) => l.id));
      loadCourse();
      show('success', 'Đã đổi thứ tự.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Đổi thứ tự thất bại.');
    } finally {
      setReordering(false);
    }
  }

  if (!course) {
    return (
      <div className="p-4 sm:p-6 min-h-[200px] flex items-center justify-center">
        <span className="text-gray-500">Đang tải...</span>
      </div>
    );
  }

  const lessons = course.lessons ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 touch-manipulation"
      >
        <ArrowLeft size={18} className="shrink-0" />
        Danh sách khóa học
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{course.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 shrink-0">
                {course.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
              </span>
            </div>
            <p className="font-mono text-sm text-gray-500 mt-1">{course.code}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-600">
              {course.level && <span>{course.level}</span>}
              {course.duration != null && <span>{course.duration} buổi</span>}
              {course.price != null && <span>{formatPrice(course.price, course.currency)}</span>}
            </div>
            {course.learningObjectives && (
              <div className="mt-3 text-sm min-w-0">
                <p className="font-medium text-gray-700 mb-1">Mục tiêu học tập</p>
                <div
                  className="prose prose-sm max-w-none text-gray-600 prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 break-words overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: bodyHtmlForDisplay(course.learningObjectives) }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate(`/courses/${id}/edit`)}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm touch-manipulation"
            >
              <Pencil size={18} className="shrink-0" />
              Sửa khóa học
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm touch-manipulation"
            >
              <Plus size={18} className="shrink-0" />
              Thêm bài học
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 sm:mb-6">
        <h2 className="p-3 sm:p-4 border-b border-gray-100 font-semibold flex items-center gap-2 text-base sm:text-lg">
          <UserPlus size={20} className="shrink-0" />
          Học viên đã đăng ký ({enrollments.length})
        </h2>
        <div className="p-3 sm:p-4">
          {loadingEnrollments ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : (
            <>
              {enrollments.length === 0 && !showAddEnrollment && (
                <p className="text-sm text-gray-500 mb-3">Chưa có học viên nào đăng ký. Bấm &quot;Thêm học viên&quot; để đăng ký từ CRM.</p>
              )}
              <ul className="space-y-2 mb-4">
                {enrollments.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <span className="font-medium text-gray-900">{e.user.firstName} {e.user.lastName}</span>
                      <span className="text-gray-500 text-sm ml-2">{e.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(e.enrolledAt).toLocaleDateString('vi-VN')}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Hủy đăng ký học viên này?')) return;
                          try {
                            await coursesApi.removeEnrollment(id!, e.id);
                            show('success', 'Đã hủy đăng ký.');
                            setEnrollments((prev) => prev.filter((x) => x.id !== e.id));
                          } catch (err) {
                            show('error', err instanceof Error ? err.message : 'Hủy thất bại.');
                          }
                        }}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                      >
                        Hủy đăng ký
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {showAddEnrollment ? (
                <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn tài khoản học viên</label>
                    <select
                      value={selectedUserIdForEnroll}
                      onChange={(e) => setSelectedUserIdForEnroll(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- Chọn --</option>
                      {usersForEnroll
                        .filter((u) => !enrollments.some((e) => e.userId === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!selectedUserIdForEnroll || addingEnrollment}
                    onClick={async () => {
                      if (!selectedUserIdForEnroll || !id) return;
                      setAddingEnrollment(true);
                      try {
                        await coursesApi.addEnrollment(id, selectedUserIdForEnroll);
                        show('success', 'Đã đăng ký học viên.');
                        const list = await coursesApi.getEnrollments(id);
                        setEnrollments(list as typeof enrollments);
                        setShowAddEnrollment(false);
                        setSelectedUserIdForEnroll('');
                      } catch (err) {
                        show('error', err instanceof Error ? err.message : 'Đăng ký thất bại.');
                      } finally {
                        setAddingEnrollment(false);
                      }
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
                  >
                    {addingEnrollment ? 'Đang thêm...' : 'Đăng ký'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddEnrollment(false); setSelectedUserIdForEnroll(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddEnrollment(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Plus size={16} />
                  Thêm học viên
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 sm:mb-6">
        <h2 className="p-3 sm:p-4 border-b border-gray-100 font-semibold flex items-center gap-2 text-base sm:text-lg">
          <Send size={20} className="shrink-0" />
          Yêu cầu đăng ký khóa học ({enrollmentRequests.filter((r) => r.status === 'PENDING').length} chờ duyệt)
        </h2>
        <div className="p-3 sm:p-4">
          {loadingEnrollmentRequests ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : enrollmentRequests.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có yêu cầu nào từ học viên.</p>
          ) : (
            <ul className="space-y-2">
              {enrollmentRequests.map((req) => (
                <li key={req.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <span className="font-medium text-gray-900">{req.user.firstName} {req.user.lastName}</span>
                    <span className="text-gray-500 text-sm ml-2">{req.user.email}</span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      {req.status === 'PENDING' ? 'Chờ duyệt' : req.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(req.requestedAt).toLocaleString('vi-VN')}</span>
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={reviewingRequestId === req.id}
                        onClick={async () => {
                          setReviewingRequestId(req.id);
                          try {
                            await enrollmentRequestsApi.review(req.id, { status: 'APPROVED' });
                            show('success', 'Đã duyệt đăng ký.');
                            const r = await enrollmentRequestsApi.list({ courseId: id!, limit: 100 });
                            setEnrollmentRequests(r.items);
                            loadCourse();
                          } catch (err) {
                            show('error', err instanceof Error ? err.message : 'Duyệt thất bại.');
                          } finally {
                            setReviewingRequestId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check size={14} /> Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={reviewingRequestId === req.id}
                        onClick={async () => {
                          if (!confirm('Từ chối yêu cầu này?')) return;
                          setReviewingRequestId(req.id);
                          try {
                            await enrollmentRequestsApi.review(req.id, { status: 'REJECTED' });
                            show('success', 'Đã từ chối.');
                            const r = await enrollmentRequestsApi.list({ courseId: id!, limit: 100 });
                            setEnrollmentRequests(r.items);
                          } catch (err) {
                            show('error', err instanceof Error ? err.message : 'Thao tác thất bại.');
                          } finally {
                            setReviewingRequestId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="p-3 sm:p-4 border-b border-gray-100 font-semibold flex items-center gap-2 text-base sm:text-lg">
          <BookOpen size={20} className="shrink-0" />
          Chương trình học ({lessons.length} bài)
        </h2>
        <ul className="divide-y divide-gray-100">
          {lessons.map((lesson, index) => (
            <li
              key={lesson.id}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-1 sm:gap-2 w-16 sm:w-20 shrink-0 order-1">
                <button
                  type="button"
                  disabled={reordering || index === 0}
                  onClick={() => moveLesson(lesson.id, 'up')}
                  className="p-1.5 sm:p-1 rounded hover:bg-gray-200 disabled:opacity-30 touch-manipulation"
                  title="Lên"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  disabled={reordering || index === lessons.length - 1}
                  onClick={() => moveLesson(lesson.id, 'down')}
                  className="p-1.5 sm:p-1 rounded hover:bg-gray-200 disabled:opacity-30 touch-manipulation"
                  title="Xuống"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center order-2">
                <LessonTypeIcon type={lesson.type} />
              </div>
              <div className="min-w-0 flex-1 order-3 basis-full sm:basis-auto">
                <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate flex items-center gap-1.5 flex-wrap">
                  {lessonTypeLabel(lesson.type)}
                  {lesson.durationMinutes != null && lesson.durationMinutes > 0 && ` · ${lesson.durationMinutes} phút`}
                  {' · '}
                  {lesson.isPublished ? 'Đã xuất bản' : 'Nháp'}
                  {(lesson as Lesson).isFreePreview && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600" title="Xem miễn phí">
                      <Unlock size={12} /> Miễn phí
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 order-4 ml-auto sm:ml-0">
                <button
                  onClick={() => openEdit(lesson)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg touch-manipulation"
                  title="Sửa"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => removeLesson(lesson.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg touch-manipulation"
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {lessons.length === 0 && (
          <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
            Chưa có bài học. Bấm &quot;Thêm bài học&quot; để tạo.
          </div>
        )}
      </div>

      {showLessonForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-20 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl sm:my-4 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold">
                {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học'}
              </h3>
            </div>
            <form onSubmit={saveLesson} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    onBlur={() => {
                      if (!editingLesson && !form.slug.trim() && form.title.trim()) {
                        setForm((f) => ({ ...f, slug: slugify(f.title) }));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                    placeholder={form.title.trim() ? slugify(form.title) : 'vd-bai-1'}
                    required
                  />
                  {!editingLesson && form.title.trim() && !form.slug.trim() && (
                    <p className="text-xs text-gray-500 mt-1">Để trống sẽ tự tạo từ tiêu đề.</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Mỗi bài học có thể gồm <strong>Tài liệu</strong>, <strong>Video</strong> và <strong>Bài tập</strong>. Điền các phần bên dưới tùy ý.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.durationMinutes || ''}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  />
                </div>
                <div />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL video bài giảng</label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  placeholder="YouTube, Vimeo hoặc link video trực tiếp (.mp4)"
                />
                <p className="text-xs text-gray-500 mt-1">Ví dụ: https://www.youtube.com/watch?v=xxx hoặc https://example.com/lesson.mp4</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung bài học</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  placeholder="Nhập nội dung (có thể chèn ảnh)..."
                  minHeight="200px"
                />
              </div>
              {editingLesson && (
                <div className="border-t border-gray-200 pt-6 mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <ClipboardList size={18} className="text-amber-600" />
                    Bài tập (gắn với bài học này)
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Bài tập dùng chung cấu trúc với Bài test (trắc nghiệm, tự luận). Tạo xong có thể vào trang bài test để thêm câu hỏi.
                  </p>
                  {loadingLessonQuizzes ? (
                    <p className="text-sm text-gray-500">Đang tải...</p>
                  ) : lessonQuizzes.length === 0 ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-gray-600">Chưa có bài tập.</span>
                      <button
                        type="button"
                        onClick={handleCreateLessonQuiz}
                        disabled={creatingQuiz}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
                      >
                        <Plus size={16} />
                        {creatingQuiz ? 'Đang tạo...' : 'Tạo bài tập'}
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {lessonQuizzes.map((q) => (
                        <li key={q.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="font-medium text-gray-900">{q.title}</span>
                          <Link
                            to={`/quizzes/${q.id}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            Sửa câu hỏi
                            <ExternalLink size={14} />
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={handleCreateLessonQuiz}
                          disabled={creatingQuiz}
                          className="text-sm text-amber-600 hover:underline disabled:opacity-50"
                        >
                          + Thêm bài tập khác
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Xuất bản (hiển thị cho học viên)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer" title="Bài học miễn phí: ai cũng xem được, không cần đăng ký khóa học">
                  <input
                    type="checkbox"
                    checked={form.isFreePreview}
                    onChange={(e) => setForm((f) => ({ ...f, isFreePreview: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Unlock size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-sm text-gray-700">Mở xem miễn phí (không cần đăng ký)</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm touch-manipulation"
                >
                  {savingLesson ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLessonForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm touch-manipulation"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
