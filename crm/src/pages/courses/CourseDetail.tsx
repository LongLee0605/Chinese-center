import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi, lessonsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
  type: string;
  isPublished: boolean;
};

type Course = {
  id: string;
  name: string;
  code: string;
  lessons: Lesson[];
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    orderIndex: 0,
    content: '',
    durationMinutes: 0,
    type: 'DOCUMENT',
    videoUrl: '',
    isPublished: false,
  });

  useEffect(() => {
    if (!id) return;
    coursesApi.get(id).then((c: any) => setCourse(c)).catch(console.error);
  }, [id]);

  function openNew() {
    setEditingLesson(null);
    setForm({
      title: '',
      slug: '',
      orderIndex: course?.lessons?.length ?? 0,
      content: '',
      durationMinutes: 0,
      type: 'DOCUMENT',
      videoUrl: '',
      isPublished: false,
    });
    setShowLessonForm(true);
  }

  function openEdit(lesson: Lesson) {
    setEditingLesson(lesson);
    lessonsApi.get(lesson.id).then((l: any) =>
      setForm({
        title: l.title,
        slug: l.slug,
        orderIndex: l.orderIndex ?? 0,
        content: l.content ?? '',
        durationMinutes: l.durationMinutes ?? 0,
        type: l.type ?? 'DOCUMENT',
        videoUrl: l.videoUrl ?? '',
        isPublished: l.isPublished ?? false,
      })
    ).catch(console.error);
    setShowLessonForm(true);
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingLesson) {
        await lessonsApi.update(editingLesson.id, form);
        show('success', 'Đã sửa bài học.');
      } else {
        await lessonsApi.create({ ...form, courseId: id });
        show('success', 'Đã thêm bài học.');
      }
      setShowLessonForm(false);
      if (id) coursesApi.get(id).then((c: any) => setCourse(c));
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    }
  }

  async function removeLesson(lessonId: string) {
    if (!confirm('Xóa bài học này?')) return;
    try {
      await lessonsApi.delete(lessonId);
      if (id) coursesApi.get(id).then((c: any) => setCourse(c));
      show('success', 'Đã xóa bài học.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  }

  if (!course) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <button onClick={() => navigate('/courses')} className="text-sm text-gray-500 hover:underline mb-1">
            ← Khóa học
          </button>
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <p className="text-gray-600">{course.code}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} />
          Thêm bài học
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="p-3 border-b font-medium">Bài học ({course.lessons?.length ?? 0})</h2>
        <ul className="divide-y">
          {(course.lessons || []).map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between p-3">
              <div>
                <span className="font-medium">{lesson.title}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {lesson.type} · {lesson.isPublished ? 'Đã xuất' : 'Nháp'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(lesson)} className="p-1 hover:bg-gray-100 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => removeLesson(lesson.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showLessonForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{editingLesson ? 'Sửa bài học' : 'Thêm bài học'}</h3>
            <form onSubmit={saveLesson} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="border rounded px-3 py-2"
                >
                  <option value="DOCUMENT">Tài liệu</option>
                  <option value="VIDEO">Video</option>
                  <option value="QUIZ">Quiz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung (HTML/Markdown)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full border rounded px-3 py-2 font-mono text-sm"
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Video</label>
                <input
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                <label>Xuất bản</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded">
                  Lưu
                </button>
                <button type="button" onClick={() => setShowLessonForm(false)} className="px-4 py-2 border rounded">
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
