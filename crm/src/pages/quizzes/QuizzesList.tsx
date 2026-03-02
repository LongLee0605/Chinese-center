import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizzesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Quiz = {
  id: string;
  title: string;
  slug: string;
  passingScore: number;
  isPublished: boolean;
  _count?: { questions: number };
};

export default function QuizzesList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Quiz[]; total: number } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    quizzesApi
      .list({ page, limit: 10 })
      .then((r) => setData(r as { items: Quiz[]; total: number }))
      .catch(console.error);
  }, [page]);

  async function remove(id: string) {
    if (!confirm('Xóa bài test này?')) return;
    try {
      await quizzesApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((q) => q.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa bài test.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bài test</h1>
        <Link
          to="/quizzes/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} />
          Thêm bài test
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Tiêu đề</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Câu hỏi</th>
              <th className="text-left p-3">Điểm đạt</th>
              <th className="text-left p-3">Xuất bản</th>
              <th className="w-24 p-3" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="p-3 font-medium">
                  <Link to={`/quizzes/${q.id}`} className="text-blue-600 hover:underline">
                    {q.title}
                  </Link>
                </td>
                <td className="p-3 text-gray-600">{q.slug}</td>
                <td className="p-3">{q._count?.questions ?? 0}</td>
                <td className="p-3">{q.passingScore}%</td>
                <td className="p-3">{q.isPublished ? 'Có' : 'Không'}</td>
                <td className="p-3 flex gap-2">
                  <Link to={`/quizzes/${q.id}`} className="p-1 hover:bg-gray-100 rounded">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => remove(q.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
