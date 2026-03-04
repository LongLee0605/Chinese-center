import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, avatarUrl, type UserAccount, type UserRole } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, User, Users, Clock, UserCheck } from 'lucide-react';

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

type AccountTypeFilter = 'all' | 'official' | 'trial';

/** Hiển thị thời gian còn lại hoặc hết hạn cho tài khoản tạm thời */
function TrialExpiryLabel({ trialExpiresAt }: { trialExpiresAt: string | null | undefined }) {
  if (!trialExpiresAt) return null;
  const end = new Date(trialExpiresAt);
  const now = new Date();
  if (now >= end) return <span className="text-xs text-red-600 font-medium">Đã hết hạn</span>;
  const diffMs = end.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) {
    return <span className="text-xs text-amber-700 font-medium">Còn {diffDays} ngày</span>;
  }
  if (diffHours >= 1) {
    return <span className="text-xs text-amber-700 font-medium">Còn {diffHours}h</span>;
  }
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return <span className="text-xs text-amber-700 font-medium">Còn {diffMins} phút</span>;
}

export default function AccountsList() {
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<{ items: UserAccount[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [accountType, setAccountType] = useState<AccountTypeFilter>('all');

  useEffect(() => {
    usersApi
      .list({ page, limit: 20, role: roleFilter || undefined, accountType })
      .then(setData)
      .catch((e) => {
        show('error', e?.message || 'Tải danh sách thất bại');
      });
  }, [page, roleFilter, accountType, show]);

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

  // Gom học viên theo lớp: nhóm theo currentClasses[].id; tài khoản không phải STUDENT hoặc không có lớp hiển thị riêng
  const students = data.items.filter((u) => u.role === 'STUDENT');
  const nonStudents = data.items.filter((u) => u.role !== 'STUDENT');
  const classGroups = new Map<string, { name: string; users: UserAccount[] }>();
  const ungroupedStudents: UserAccount[] = [];
  students.forEach((u) => {
    const classes = u.currentClasses ?? [];
    if (classes.length === 0) {
      ungroupedStudents.push(u);
    } else {
      classes.forEach((c) => {
        if (!classGroups.has(c.id)) {
          classGroups.set(c.id, { name: c.name, users: [] });
        }
        classGroups.get(c.id)!.users.push(u);
      });
    }
  });
  const classGroupList = Array.from(classGroups.entries()).map(([id, g]) => ({ classId: id, ...g }));

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Quản lý tài khoản</h1>
          <p className="crm-page-subtitle">Tổng {data.total} tài khoản</p>
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <Link to="/accounts/new" className="crm-btn-primary shrink-0">
            <Plus size={18} />
            Thêm tài khoản
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 shrink-0">Loại tài khoản:</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['all', 'official', 'trial'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setAccountType(type); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  accountType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' ? 'Tất cả' : type === 'official' ? 'Chính thức' : 'Tạm thời'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 shrink-0">Vai trò:</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="crm-select w-auto min-w-[140px]"
          >
            <option value="">Tất cả</option>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Nhóm theo lớp (chỉ khi không lọc role hoặc lọc STUDENT) */}
      {(!roleFilter || roleFilter === 'STUDENT') && (classGroupList.length > 0 || ungroupedStudents.length > 0) ? (
        <div className="space-y-6">
          {classGroupList.map(({ classId, name, users }) => (
            <div key={classId} className="crm-card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <Link to={`/classes/${classId}`} className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                  {name}
                </Link>
                <span className="text-sm text-slate-500">{users.length} học viên</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Tài khoản</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Loại</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Trạng thái</th>
                    <th className="text-left p-4 w-32 text-sm font-semibold text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="p-4">
                        <Link to={`/accounts/${u.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {u.avatar ? (
                              <img src={avatarUrl(u.avatar)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                            ) : null}
                            <User size={18} className={`text-slate-400 ${u.avatar ? 'hidden' : ''}`} strokeWidth={1.5} />
                          </div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 group-hover:underline">{u.firstName} {u.lastName}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-slate-600"><a href={`mailto:${u.email}`} className="hover:underline break-all">{u.email}</a></td>
                      <td className="p-4">
                        {u.isTrial ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock size={12} /> Tạm thời
                            </span>
                            <TrialExpiryLabel trialExpiresAt={u.trialExpiresAt} />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <UserCheck size={12} /> Chính thức
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link to={`/accounts/${u.id}/edit`} className="crm-btn-ghost p-1.5" title="Sửa"><Pencil size={16} /></Link>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button type="button" onClick={() => remove(u.id)} className="crm-btn-ghost p-1.5 text-red-600 hover:bg-red-50" title="Xóa"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {ungroupedStudents.length > 0 && (
            <div className="crm-card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Chưa xếp lớp</span>
                <span className="text-sm text-slate-500 ml-2">{ungroupedStudents.length} học viên</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Tài khoản</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Loại</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Trạng thái</th>
                    <th className="text-left p-4 w-32 text-sm font-semibold text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {ungroupedStudents.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="p-4">
                        <Link to={`/accounts/${u.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {u.avatar ? (
                              <img src={avatarUrl(u.avatar)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                            ) : null}
                            <User size={18} className={`text-slate-400 ${u.avatar ? 'hidden' : ''}`} strokeWidth={1.5} />
                          </div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 group-hover:underline">{u.firstName} {u.lastName}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-slate-600"><a href={`mailto:${u.email}`} className="hover:underline break-all">{u.email}</a></td>
                      <td className="p-4">
                        {u.isTrial ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock size={12} /> Tạm thời
                            </span>
                            <TrialExpiryLabel trialExpiresAt={u.trialExpiresAt} />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <UserCheck size={12} /> Chính thức
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link to={`/accounts/${u.id}/edit`} className="crm-btn-ghost p-1.5" title="Sửa"><Pencil size={16} /></Link>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button type="button" onClick={() => remove(u.id)} className="crm-btn-ghost p-1.5 text-red-600 hover:bg-red-50" title="Xóa"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Giảng viên / Admin: hiển thị khi không lọc hoặc lọc khác STUDENT */}
          {nonStudents.length > 0 && (
            <div className="crm-card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Giảng viên / Admin</span>
                <span className="text-sm text-slate-500 ml-2">{nonStudents.length} tài khoản</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Tài khoản</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Vai trò</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Loại</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Trạng thái</th>
                    <th className="text-left p-4 w-32 text-sm font-semibold text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {nonStudents.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="p-4">
                        <Link to={`/accounts/${u.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {u.avatar ? (
                              <img src={avatarUrl(u.avatar)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                            ) : null}
                            <User size={18} className={`text-slate-400 ${u.avatar ? 'hidden' : ''}`} strokeWidth={1.5} />
                          </div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 group-hover:underline">{u.firstName} {u.lastName}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-slate-600"><a href={`mailto:${u.email}`} className="hover:underline break-all">{u.email}</a></td>
                      <td className="p-4 text-slate-600">{ROLE_LABEL[u.role]}</td>
                      <td className="p-4">
                        {u.isTrial ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock size={12} /> Tạm thời
                            </span>
                            <TrialExpiryLabel trialExpiresAt={u.trialExpiresAt} />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <UserCheck size={12} /> Chính thức
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link to={`/accounts/${u.id}/edit`} className="crm-btn-ghost p-1.5" title="Sửa"><Pencil size={16} /></Link>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <button type="button" onClick={() => remove(u.id)} className="crm-btn-ghost p-1.5 text-red-600 hover:bg-red-50" title="Xóa"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.total > 20 && (
            <div className="p-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 crm-card mt-4">
              <span className="text-sm text-slate-600">Tổng {data.total} tài khoản</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Trước</button>
                <button type="button" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="crm-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Tài khoản</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Vai trò</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Loại</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Trạng thái</th>
              <th className="text-left p-4 text-sm font-semibold text-slate-700">Lớp</th>
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
                  {u.isTrial ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock size={12} /> Tạm thời
                      </span>
                      <TrialExpiryLabel trialExpiresAt={u.trialExpiresAt} />
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <UserCheck size={12} /> Chính thức
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[u.status] ?? u.status}
                  </span>
                </td>
                <td className="p-4 text-slate-600 text-sm">
                  {u.role === 'STUDENT' && (u.currentClasses?.length ?? 0) > 0
                    ? (u.currentClasses ?? []).map((c) => <Link key={c.id} to={`/classes/${c.id}`} className="text-blue-600 hover:underline mr-1">{c.name}</Link>)
                    : u.role === 'TEACHER' && (u.classesTeachingCurrent?.length ?? 0) > 0
                      ? (u.classesTeachingCurrent ?? []).map((c) => <Link key={c.id} to={`/classes/${c.id}`} className="text-blue-600 hover:underline mr-1">{c.name}</Link>)
                      : '—'}
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
      )}
    </div>
  );
}
