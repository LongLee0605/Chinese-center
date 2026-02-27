import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  code: string;
  level: string;
  status: string;
  _count?: { lessons: number; quizzes: number };
};

export default function CoursesList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Course[]; total: number } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    coursesApi
      .list({ page, limit: 10 })
      .then((r) => setData(r as { items: Course[]; total: number }))
      .catch(console.error);
  }, [page]);

  async function remove(id: string) {
    if (!confirm('Xóa khóa học này? (sẽ xóa cả bài học)')) return;
    try {
      await coursesApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((c) => c.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa khóa học.');
    } catch (e: any) {
      show('error', e?.message || 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Khóa học</h1>
        <Link
          to="/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} />
          Thêm khóa học
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Mã</th>
              <th className="text-left p-3">Tên</th>
              <th className="text-left p-3">Cấp độ</th>
              <th className="text-left p-3">Bài học</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="w-24 p-3" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3 font-medium">
                  <Link to={`/courses/${c.id}`} className="text-blue-600 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3">{c.level}</td>
                <td className="p-3">{c._count?.lessons ?? 0}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3 flex gap-2">
                  <Link to={`/courses/${c.id}`} className="p-1 hover:bg-gray-100 rounded">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => remove(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
            <span className="py-1">{page} / {Math.ceil(data.total / 10)}</span>
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
