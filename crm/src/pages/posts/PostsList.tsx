import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Post = { id: string; title: string; slug: string; status: string; createdAt: string };

export default function PostsList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Post[]; total: number } | null>(null);
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    postsApi
      .list({ page, limit: 10, status: status || undefined })
      .then((r) => setData(r as { items: Post[]; total: number }))
      .catch(console.error);
  }, [page, status]);

  async function remove(id: string) {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await postsApi.delete(id);
      setData((d) => d ? { ...d, items: d.items.filter((p) => p.id !== id), total: d.total - 1 } : null);
      show('success', 'Đã xóa bài viết.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bài viết</h1>
        <Link
          to="/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} />
          Thêm bài viết
        </Link>
      </div>
      <div className="mb-4 flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="">Tất cả</option>
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Tiêu đề</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Ngày tạo</th>
              <th className="w-24 p-3" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3 text-gray-600">{p.slug}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 text-sm text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString('vi')}
                </td>
                <td className="p-3 flex gap-2">
                  <Link to={`/posts/${p.id}`} className="p-1 hover:bg-gray-100 rounded">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => remove(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.total > 10 && (
          <div className="p-2 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <span className="py-1">
              {page} / {Math.ceil(data.total / 10)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 10)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
