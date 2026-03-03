import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, avatarUrl, type UserAccount, type UserRole } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, User, Users } from 'lucide-react';

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

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  INACTIVE: 'bg-slate-100 text-slate-600',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
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
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Quản lý tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng {data.total} tài khoản</p>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link to="/accounts/new" className="crm-btn-primary">
            <Plus size={18} />
            Thêm tài khoản
          </Link>
        )}
      </div>
      <div className="mb-5 flex flex-wrap gap-2 items-center">
        <label className="text-sm text-slate-600">Lọc theo vai trò:</label>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="crm-input w-auto min-w-[140px] py-2 text-sm"
        >
          <option value="">Tất cả</option>
          {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <div className="crm-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Tài khoản</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Vai trò</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Trạng thái</th>
              <th className="text-left p-4 w-32 text-sm font-semibold text-slate-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <Link to={`/accounts/${u.id}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {u.avatar ? (
                        <img
                          src={avatarUrl(u.avatar)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <User size={18} className={`text-slate-400 ${u.avatar ? 'hidden' : ''}`} strokeWidth={1.5} />
                    </div>
                    <span className="font-medium text-slate-900 group-hover:text-blue-600 group-hover:underline">
                      {u.firstName} {u.lastName}
                    </span>
                  </Link>
                </td>
                <td className="p-4 text-slate-600">
                  <a href={`mailto:${u.email}`} className="hover:text-slate-900 hover:underline break-all">
                    {u.email}
                  </a>
                </td>
                <td className="p-4 text-slate-600">{ROLE_LABEL[u.role]}</td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[u.status] ?? u.status}
                  </span>
                </td>
                <td className="p-4">
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
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Chưa có tài khoản nào</p>
            <p className="text-slate-500 text-sm mt-1">Thêm tài khoản để bắt đầu quản lý</p>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Link to="/accounts/new" className="inline-block mt-4 crm-btn-primary">
                <Plus size={18} />
                Thêm tài khoản
              </Link>
            )}
          </div>
        )}
        {data.total > 20 && (
          <div className="p-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
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
