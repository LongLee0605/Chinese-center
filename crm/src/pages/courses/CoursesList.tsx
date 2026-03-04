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
      <div className="crm-page-header">
        <h1 className="crm-page-title flex items-center gap-2">
          <BookOpen size={28} className="shrink-0" />
          Khóa học
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="crm-select w-auto min-w-[140px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
          <Link to="/courses/new" className="crm-btn-primary">
            <Plus size={18} />
            Thêm khóa học
          </Link>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Mã / Tên</th>
                <th>Cấp độ</th>
                <th>Bài học</th>
                <th>Thời lượng</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th className="w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-mono text-sm text-slate-500">{c.code}</div>
                    <Link to={`/courses/${c.id}`} className="font-medium text-slate-900 hover:text-slate-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.level}</td>
                  <td>{c._count?.lessons ?? 0} bài</td>
                  <td>{c.duration != null ? `${c.duration} buổi` : '—'}</td>
                  <td>{formatPrice(c.price, c.currency)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/courses/${c.id}/edit`} className="crm-btn-ghost" title="Chỉnh sửa"><Pencil size={18} /></Link>
                      <Link to={`/courses/${c.id}`} className="crm-btn-ghost" title="Xem chi tiết & bài học"><BookOpen size={18} /></Link>
                      <button type="button" onClick={() => remove(c.id)} className="crm-btn-ghost text-red-600 hover:bg-red-50" title="Xóa"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.total > 10 && (
          <div className="crm-pagination">
            <span className="text-sm text-slate-600">Tổng {data.total} khóa học</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0">Trước</button>
              <span className="text-sm text-slate-600">Trang {page} / {Math.ceil(data.total / 10)}</span>
              <button type="button" disabled={page >= Math.ceil(data.total / 10)} onClick={() => setPage((p) => p + 1)} className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
