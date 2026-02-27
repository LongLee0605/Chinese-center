import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function CourseForm() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    nameZh: '',
    description: '',
    level: 'HSK1',
    duration: 0,
    maxStudents: 20,
    price: 0,
    currency: 'VND',
    status: 'DRAFT',
    slug: '',
    thumbnail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const c = await coursesApi.create(form) as { id: string };
      show('success', 'Đã tạo khóa học.');
      navigate(`/courses/${c.id}`);
    } catch (err: any) {
      show('error', err?.message || 'Tạo khóa học thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Thêm khóa học</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mã khóa</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tên khóa học</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tên tiếng Trung (tùy chọn)</label>
          <input
            value={form.nameZh}
            onChange={(e) => setForm((f) => ({ ...f, nameZh: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cấp độ</label>
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="HSK1">HSK1</option>
              <option value="HSK2">HSK2</option>
              <option value="HSK3">HSK3</option>
              <option value="HSK4">HSK4</option>
              <option value="HSK5">HSK5</option>
              <option value="HSK6">HSK6</option>
              <option value="Beginner">Beginner</option>
              <option value="Kids">Kids</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thời lượng (buổi)</label>
            <input
              type="number"
              min={0}
              value={form.duration || ''}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) || 0 }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sĩ số tối đa</label>
            <input
              type="number"
              min={1}
              value={form.maxStudents}
              onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) || 20 }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá (VND)</label>
            <input
              type="number"
              min={0}
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Xuất bản</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh bìa (URL)</label>
          <input
            value={form.thumbnail}
            onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Đang tạo...' : 'Tạo khóa học'}
          </button>
          <button type="button" onClick={() => navigate('/courses')} className="px-4 py-2 border rounded hover:bg-gray-50">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
