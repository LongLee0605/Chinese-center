import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teachersApi, type Teacher } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/?$/, '');

function avatarUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${UPLOADS_BASE}/uploads/${avatarPath}`;
}

export default function TeachersList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Teacher[]; total: number } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    teachersApi
      .list({ page, limit: 20 })
      .then(setData)
      .catch((e) => {
        show('error', e?.message || 'Tải danh sách thất bại');
      });
  }, [page, show]);

  async function remove(id: string) {
    if (!confirm('Xóa giáo viên này? Hành động không thể hoàn tác.')) return;
    try {
      await teachersApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((t) => t.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa giáo viên.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý giáo viên</h1>
        <Link
          to="/teachers/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} />
          Thêm giáo viên
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 w-14">Ảnh</th>
              <th className="text-left p-3">Tên</th>
              <th className="text-left p-3">Chức danh</th>
              <th className="text-left p-3">Chuyên môn</th>
              <th className="text-left p-3">Hiển thị</th>
              <th className="text-left p-3 w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {t.avatarPath ? (
                      <img src={avatarUrl(t.avatarPath)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">{t.name.charAt(0)}</span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-medium">
                  <Link to={`/teachers/${t.id}`} className="text-blue-600 hover:underline">
                    {t.name}
                  </Link>
                </td>
                <td className="p-3">{t.title ?? '—'}</td>
                <td className="p-3">{t.specializations?.length ? t.specializations.join(', ') : '—'}</td>
                <td className="p-3">{t.isPublic ? 'Có' : 'Ẩn'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/teachers/${t.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    >
                      <Pencil size={14} />
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-700 border border-red-200 rounded hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.total > 20 && (
          <div className="p-2 flex justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <span className="py-1">
              {page} / {Math.ceil(data.total / 20)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 20)}
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
