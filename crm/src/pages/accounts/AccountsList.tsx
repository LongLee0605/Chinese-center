import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, type UserAccount, type UserRole } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEACHER: 'Giảng viên',
  STUDENT: 'Học viên',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Vô hiệu',
  PENDING_VERIFICATION: 'Chờ xác minh',
};

export default function AccountsList() {
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<{ items: UserAccount[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    usersApi
      .list({ page, limit: 20, role: roleFilter || undefined })
      .then(setData)
      .catch((e) => {
        show('error', e?.message || 'Tải danh sách thất bại');
      });
  }, [page, roleFilter, show]);

  async function remove(id: string) {
    if (!confirm('Xóa tài khoản này? Hành động không thể hoàn tác.')) return;
    try {
      await usersApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((u) => u.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa tài khoản.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) return <div className="crm-page flex items-center justify-center min-h-[200px]"><span className="text-slate-500">Đang tải...</span></div>;

  return (
    <div className="crm-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link to="/accounts/new" className="crm-btn-primary">
            <Plus size={18} />
            Thêm tài khoản
          </Link>
        )}
      </div>
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm text-slate-600">Lọc theo vai trò:</label>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tất cả</option>
          {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <div className="crm-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Họ tên</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Vai trò</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3 w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">
                  <Link to={`/accounts/${u.id}`} className="text-blue-600 hover:underline">
                    {u.firstName} {u.lastName}
                  </Link>
                </td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{ROLE_LABEL[u.role]}</td>
                <td className="p-3">{STATUS_LABEL[u.status] ?? u.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link to={`/accounts/${u.id}/edit`} className="crm-btn-ghost p-1.5" title="Sửa">
                      <Pencil size={16} />
                    </Link>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <button
                        type="button"
                        onClick={() => remove(u.id)}
                        className="crm-btn-ghost p-1.5 text-red-600 hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.items.length === 0 && (
          <p className="p-6 text-center text-slate-500">Chưa có tài khoản nào.</p>
        )}
        {data.total > 20 && (
          <div className="p-3 border-t flex justify-between items-center">
            <span className="text-sm text-slate-600">Tổng {data.total} tài khoản</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
