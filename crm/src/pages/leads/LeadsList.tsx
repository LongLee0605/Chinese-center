import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leadsApi, type Lead } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Trash2 } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  TU_VAN: 'Tư vấn',
  DANG_KY_HOC_THU: 'Đăng ký học thử',
};

export default function LeadsList() {
  const { show } = useToast();
  const [data, setData] = useState<{ items: Lead[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    leadsApi
      .list({ page, limit: 15, type: typeFilter || undefined })
      .then((r) => setData(r))
      .catch(() => setData({ items: [], total: 0 }));
  }, [page, typeFilter]);

  const handleDelete = async (lead: Lead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Xóa đăng ký của ${lead.name}?`)) return;
    try {
      await leadsApi.delete(lead.id);
      setData((d) => (d ? { ...d, items: d.items.filter((l) => l.id !== lead.id), total: d.total - 1 } : null));
      show('success', 'Đã xóa đăng ký.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  };

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email đăng ký</h1>
      <p className="text-gray-600 text-sm mb-4">
        Các form Liên hệ (tư vấn) và Đăng ký học thử trên website khi gửi sẽ lưu tại đây và gửi email về chủ website.
      </p>
      <div className="mb-4 flex gap-2 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded px-3 py-1.5"
        >
          <option value="">Tất cả</option>
          <option value="TU_VAN">Tư vấn</option>
          <option value="DANG_KY_HOC_THU">Đăng ký học thử</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Thời gian</th>
                <th className="text-left p-3 text-sm font-medium">Loại</th>
                <th className="text-left p-3 text-sm font-medium">Họ tên</th>
                <th className="text-left p-3 text-sm font-medium">Email</th>
                <th className="text-left p-3 text-sm font-medium">Điện thoại</th>
                <th className="text-left p-3 text-sm font-medium">Nội dung / Khóa / Ghi chú</th>
                <th className="w-24 p-3 text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Chưa có đăng ký nào.
                  </td>
                </tr>
              ) : (
                data.items.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          lead.type === 'DANG_KY_HOC_THU' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {TYPE_LABELS[lead.type] ?? lead.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="p-3">
                      <a href={`tel:${lead.phone}`} className="text-primary-600">{lead.phone}</a>
                    </td>
                    <td className="p-3 text-sm text-gray-600 max-w-xs">
                      {[lead.message, lead.courseInterest, lead.timePreference, lead.note]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(lead, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.total > 15 && (
          <div className="p-2 flex justify-center gap-2 border-t">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <span className="py-1">
              {page} / {Math.ceil(data.total / 15)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 15)}
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
