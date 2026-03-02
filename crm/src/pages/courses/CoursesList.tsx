import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

type Course = {
  id: string;
  name: string;
  code: string;
  level: string;
  status: string;
  duration?: number;
  price?: number;
  currency?: string;
  _count?: { lessons: number; quizzes: number };
};

function formatPrice(price: number | undefined, currency: string | undefined): string {
  if (price == null) return '—';
  const c = currency ?? 'VND';
  if (c === 'VND') return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(price);
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === 'PUBLISHED';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isPublished ? 'Đã xuất bản' : 'Nháp'}
    </span>
  );
}

export default function CoursesList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Course[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    coursesApi
      .list({ page, limit: 10, status: statusFilter || undefined })
      .then((r) => setData(r as { items: Course[]; total: number }))
      .catch(console.error);
  }, [page, statusFilter]);

  async function remove(id: string) {
    if (!confirm('Xóa khóa học này? Sẽ xóa cả bài học và dữ liệu liên quan.')) return;
    try {
      await coursesApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((c) => c.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa khóa học.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="crm-page flex items-center justify-center min-h-[200px]"><span className="text-slate-500">Đang tải...</span></div>;

  return (
    <div className="crm-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={28} />
          Khóa học
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
          <Link
            to="/courses/new"
            className="crm-btn-primary"
          >
            <Plus size={18} />
            Thêm khóa học
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Mã / Tên</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Cấp độ</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Bài học</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Thời lượng</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Giá</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="w-28 p-4 text-right text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-mono text-sm text-gray-500">{c.code}</div>
                    <Link to={`/courses/${c.id}`} className="font-medium text-gray-900 hover:text-gray-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-600">{c.level}</td>
                  <td className="p-4">{c._count?.lessons ?? 0} bài</td>
                  <td className="p-4 text-gray-600">{c.duration != null ? `${c.duration} buổi` : '—'}</td>
                  <td className="p-4 text-gray-600">{formatPrice(c.price, c.currency)}</td>
                  <td className="p-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/courses/${c.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={18} />
                      </Link>
                      <Link
                        to={`/courses/${c.id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Xem chi tiết & bài học"
                      >
                        <BookOpen size={18} />
                      </Link>
                      <button
                        onClick={() => remove(c.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > 10 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {Math.ceil(data.total / 10)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 10)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
