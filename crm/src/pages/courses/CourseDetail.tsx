import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi, lessonsApi, bodyHtmlForDisplay, bodyHtmlForSave } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import RichTextEditor from '../../components/RichTextEditor';
import { Plus, Pencil, Trash2, ArrowLeft, BookOpen, Video, FileText, ClipboardList, ChevronUp, ChevronDown } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
  type: string;
  durationMinutes?: number | null;
  isPublished: boolean;
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

  function openNew() {
    setEditingLesson(null);
    setForm({ ...INITIAL_LESSON_FORM, orderIndex: course?.lessons?.length ?? 0 });
    setShowLessonForm(true);
  }

  function openEdit(lesson: Lesson) {
    setEditingLesson(lesson);
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
        });
      })
      .catch(() => show('error', 'Không tải được bài học.'));
    setShowLessonForm(true);
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
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {lessonTypeLabel(lesson.type)}
                  {lesson.durationMinutes != null && lesson.durationMinutes > 0 && ` · ${lesson.durationMinutes} phút`}
                  {' · '}
                  {lesson.isPublished ? 'Đã xuất bản' : 'Nháp'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại bài học</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                  >
                    <option value="DOCUMENT">Tài liệu</option>
                    <option value="VIDEO">Video</option>
                    <option value="QUIZ">Bài test</option>
                  </select>
                </div>
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
              </div>
              {form.type === 'VIDEO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Video</label>
                  <input
                    value={form.videoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
                    placeholder="https://..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung bài học</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  placeholder="Nhập nội dung (có thể chèn ảnh)..."
                  minHeight="200px"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lesson-published"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="lesson-published" className="text-sm text-gray-700">
                  Xuất bản (hiển thị cho học viên)
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
