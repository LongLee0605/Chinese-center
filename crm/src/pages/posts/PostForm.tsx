import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const isNew = id === 'new' || !id;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    coverImage: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    if (!isNew && id) {
      postsApi
        .get(id)
        .then((p: any) =>
          setForm({
            title: p.title ?? '',
            slug: p.slug ?? '',
            excerpt: p.excerpt ?? '',
            body: p.body ?? '',
            coverImage: p.coverImage ?? '',
            status: p.status ?? 'DRAFT',
          })
        )
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
    };
    (isNew ? postsApi.create(payload) : postsApi.update(id!, payload))
      .then(() => {
        show('success', isNew ? 'Đã tạo bài viết.' : 'Đã lưu bài viết.');
        navigate('/posts');
      })
      .catch((e: any) => show('error', e?.message || 'Lưu thất bại.'))
      .finally(() => setSaving(false));
  }

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{isNew ? 'Thêm bài viết' : 'Sửa bài viết'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nội dung (HTML/Markdown)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            rows={12}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh bìa (URL)</label>
          <input
            value={form.coverImage}
            onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
