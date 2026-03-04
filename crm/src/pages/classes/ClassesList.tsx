import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesApi, type ClassItem } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, Users, GraduationCap, Lock, ChevronRight } from 'lucide-react';

const LIMIT = 20;

export default function ClassesList() {
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<{ items: ClassItem[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    classesApi
      .list({ page, limit: LIMIT, status: statusFilter || undefined })
      .then((r) => setData({ items: r.items, total: r.total }))
      .catch((e) => {
        show('error', e?.message || 'Tải danh sách lớp thất bại');
      });
  }, [page, statusFilter, show]);

  async function remove(id: string, name: string) {
    if (!confirm(`Xóa lớp "${name}"? Sẽ xóa cả danh sách thành viên trong lớp.`)) return;
    try {
      await classesApi.delete(id);
      setData((d) => (d ? { ...d, items: d.items.filter((c) => c.id !== id), total: d.total - 1 } : null));
      show('success', 'Đã xóa lớp.');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    }
  }

  if (!data) {
    return (
      <div className="crm-page">
        <div className="crm-page-header">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="crm-filter-bar">
          <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="crm-card crm-card-padding h-20 bg-slate-50 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const openCount = data.items.filter((c) => c.status === 'OPEN').length;
  const closedCount = data.items.filter((c) => c.status === 'CLOSED').length;

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Lớp học</h1>
          <p className="crm-page-subtitle">
            Tổng {data.total} lớp
            {data.total > 0 && (
              <span className="text-slate-400 ml-2">
                · {openCount} đang mở · {closedCount} đã đóng
              </span>
            )}
          </p>
        </div>
        <Link to="/classes/new" className="crm-btn-primary shrink-0">
          <Plus size={18} />
          Thêm lớp
        </Link>
      </div>

      <div className="crm-filter-bar">
        <label className="text-sm font-medium text-slate-600 shrink-0">Trạng thái:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="crm-select w-auto min-w-[160px]"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả</option>
          <option value="OPEN">Đang mở</option>
          <option value="CLOSED">Đã đóng</option>
        </select>
      </div>

      {data.items.length === 0 ? (
        <div className="crm-card crm-card-padding">
          <div className="crm-empty-state">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <GraduationCap className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Chưa có lớp nào</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Tạo lớp để gán giảng viên và quản lý học viên theo từng lớp.
            </p>
            <Link to="/classes/new" className="inline-flex items-center gap-2 mt-6 crm-btn-primary">
              <Plus size={18} />
              Thêm lớp đầu tiên
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Card view: tốt trên mobile & tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:hidden gap-4">
            {data.items.map((c) => {
              const schedule: any = c;
              return (
              <div
                key={c.id}
                className="crm-card crm-card-padding hover:shadow-cardHover hover:border-slate-300/80 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/classes/${c.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-crm-accent/10 flex items-center justify-center shrink-0 group-hover:bg-crm-accent/20 transition-colors">
                        <GraduationCap size={20} className="text-crm-accent" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-slate-900 truncate group-hover:text-crm-accent transition-colors">
                          {c.name}
                        </h2>
                        <p className="text-sm text-slate-500 truncate">
                          {c.teacher.firstName} {c.teacher.lastName}
                        </p>
                        {(schedule.scheduleStartTime || schedule.scheduleDayOfWeek?.length) && (
                          <p className="mt-1 text-xs text-slate-500 truncate">
                            {schedule.scheduleDayOfWeek?.length
                              ? (schedule.scheduleDayOfWeek as number[])
                                  .map((d) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d] ?? `T${d + 1}`)
                                  .join(', ')
                              : 'Lịch chưa cấu hình'}{' '}
                            {schedule.scheduleStartTime && schedule.scheduleEndTime
                              ? `· ${schedule.scheduleStartTime} – ${schedule.scheduleEndTime}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <Users size={14} />
                        {(c.memberCount ?? c._count?.members ?? 0)} học viên
                      </span>
                      {c.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Đang mở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <Lock size={10} /> Đã đóng
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/classes/${c.id}`}
                      className="crm-btn-ghost"
                      title="Xem / Quản lý học viên"
                      aria-label="Mở lớp"
                    >
                      <ChevronRight size={20} className="text-slate-400" />
                    </Link>
                    {c.status === 'OPEN' && (
                      <Link to={`/classes/${c.id}/edit`} className="crm-btn-ghost" title="Sửa">
                        <Pencil size={16} />
                      </Link>
                    )}
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <button
                        type="button"
                        onClick={() => remove(c.id, c.name)}
                        className="crm-btn-ghost text-red-600 hover:bg-red-50"
                        title="Xóa"
                        aria-label="Xóa lớp"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Table view: desktop */}
          <div className="hidden xl:block crm-card overflow-hidden">
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Lớp</th>
                    <th>Giảng viên</th>
                    <th>Lịch học</th>
                    <th>Phòng</th>
                    <th>Học viên</th>
                    <th>Trạng thái</th>
                    <th className="w-36 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => {
                    const schedule: any = c;
                    const days =
                      schedule.scheduleDayOfWeek?.length
                        ? (schedule.scheduleDayOfWeek as number[])
                            .map((d: number) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d] ?? `T${d + 1}`)
                            .join(', ')
                        : '';
                    const time =
                      schedule.scheduleStartTime && schedule.scheduleEndTime
                        ? `${schedule.scheduleStartTime} – ${schedule.scheduleEndTime}`
                        : '';
                    const scheduleText = days || time ? `${days}${days && time ? ' · ' : ''}${time}` : 'Chưa cấu hình';
                    return (
                      <tr key={c.id}>
                        <td>
                          <Link
                            to={`/classes/${c.id}`}
                            className="font-medium text-slate-900 hover:text-crm-accent hover:underline flex items-center gap-2"
                          >
                            <GraduationCap size={18} className="text-slate-400 shrink-0" />
                            {c.name}
                          </Link>
                        </td>
                        <td>{c.teacher.firstName} {c.teacher.lastName}</td>
                        <td className="text-sm text-slate-600">{scheduleText}</td>
                        <td className="text-sm text-slate-600">{(schedule as any).room ?? '—'}</td>
                        <td>{(c.memberCount ?? c._count?.members ?? 0)} học viên</td>
                        <td>
                          {c.status === 'OPEN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Đang mở
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              <Lock size={12} /> Đã đóng
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link to={`/classes/${c.id}`} className="crm-btn-ghost" title="Xem / Quản lý">
                              <Users size={16} />
                            </Link>
                            {c.status === 'OPEN' && (
                              <Link to={`/classes/${c.id}/edit`} className="crm-btn-ghost" title="Sửa">
                                <Pencil size={16} />
                              </Link>
                            )}
                            {currentUser?.role === 'SUPER_ADMIN' && (
                              <button
                                type="button"
                                onClick={() => remove(c.id, c.name)}
                                className="crm-btn-ghost text-red-600 hover:bg-red-50"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.total > LIMIT && (
              <div className="crm-pagination">
                <span className="text-sm text-slate-600">Tổng {data.total} lớp</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-slate-600 flex items-center px-2">
                    {page} / {Math.ceil(data.total / LIMIT)}
                  </span>
                  <button
                    type="button"
                    disabled={page * LIMIT >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                    className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination cho card view */}
          {data.total > LIMIT && (
            <div className="xl:hidden mt-4 crm-card crm-pagination">
              <span className="text-sm text-slate-600">Tổng {data.total} lớp</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600 flex items-center px-2">{page} / {Math.ceil(data.total / LIMIT)}</span>
                <button
                  type="button"
                  disabled={page * LIMIT >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="crm-btn-secondary text-sm py-1.5 px-3 min-h-0"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
