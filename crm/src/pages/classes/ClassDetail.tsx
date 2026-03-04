import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classesApi, usersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, UserPlus, Lock, UserMinus, Mail, Phone, Search, Check, X, RotateCcw, Trash2 } from 'lucide-react';

type ClassDetailType = {
  id: string;
  name: string;
  status: string;
  closedAt?: string | null;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  members: Array<{
    id: string;
    joinedAt: string;
    user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
  }>;
  guestRequests?: Array<{
    id: string;
    className: string | null;
    classDate: string | null;
    email: string;
    fullName: string;
    phone: string | null;
    message: string | null;
    status: string;
    createdAt: string;
  }>;
};

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [classData, setClassData] = useState<ClassDetailType | null>(null);
  const [studentsForAdd, setStudentsForAdd] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [revertingRequestId, setRevertingRequestId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    if (!addSearch.trim()) return studentsForAdd;
    const q = addSearch.trim().toLowerCase();
    return studentsForAdd.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [studentsForAdd, addSearch]);

  function load() {
    if (!id) return;
    classesApi
      .get(id)
      .then((c) => setClassData(c as ClassDetailType))
      .catch((e) => show('error', e?.message || 'Không tải được lớp'));
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (showAddModal && id && classData) {
      usersApi
        .list({ role: 'STUDENT', limit: 500 })
        .then((r) => {
          const inClass = new Set(classData.members.map((m) => m.user.id));
          setStudentsForAdd(r.items.filter((u) => !inClass.has(u.id)));
        })
        .catch(() => setStudentsForAdd([]));
    } else {
      setAddSearch('');
    }
  }, [showAddModal, id, classData?.members]);

  async function addMember(userId: string) {
    if (!id) return;
    setAddingUserId(userId);
    try {
      await classesApi.addMember(id, userId);
      show('success', 'Đã thêm học viên vào lớp.');
      setShowAddModal(false);
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Thêm thất bại.');
    } finally {
      setAddingUserId(null);
    }
  }

  async function removeMember(userId: string) {
    if (!id || !confirm('Xóa học viên này khỏi lớp?')) return;
    setRemovingId(userId);
    try {
      await classesApi.removeMember(id, userId);
      show('success', 'Đã xóa khỏi lớp.');
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Xóa thất bại.');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleReviewRegistrationRequest(requestId: string, status: 'APPROVED' | 'REJECTED') {
    if (!id) return;
    if (status === 'REJECTED' && !confirm('Từ chối đăng ký này?')) return;
    setReviewingRequestId(requestId);
    try {
      await classesApi.reviewRegistrationRequest(id, requestId, { status });
      show('success', status === 'APPROVED' ? 'Đã duyệt. Đã gửi mail thông tin buổi học.' : 'Đã từ chối.');
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setReviewingRequestId(null);
    }
  }

  async function handleRevertRegistrationRequest(requestId: string) {
    if (!id || !confirm('Hoàn duyệt đơn này? Học viên sẽ bị bỏ khỏi lớp và đơn chuyển về chờ duyệt.')) return;
    setRevertingRequestId(requestId);
    try {
      await classesApi.revertRegistrationRequest(id, requestId);
      show('success', 'Đã hoàn duyệt. Đơn chuyển về chờ duyệt.');
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setRevertingRequestId(null);
    }
  }

  async function handleDeleteRegistrationRequest(requestId: string) {
    if (!id || !confirm('Xóa đơn đăng ký này? Nếu đã duyệt, học viên sẽ bị bỏ khỏi lớp.')) return;
    setDeletingRequestId(requestId);
    try {
      await classesApi.deleteRegistrationRequest(id, requestId);
      show('success', 'Đã xóa đơn đăng ký.');
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setDeletingRequestId(null);
    }
  }

  async function closeClass() {
    if (!id || !confirm('Đóng lớp? Sau khi đóng không thể thêm/xóa học viên.')) return;
    setClosing(true);
    try {
      await classesApi.close(id);
      show('success', 'Đã đóng lớp.');
      load();
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Đóng lớp thất bại.');
    } finally {
      setClosing(false);
    }
  }

  if (!classData) {
    return (
      <div className="crm-page flex items-center justify-center min-h-[280px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-crm-accent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  const isOpen = classData.status === 'OPEN';

  return (
    <div className="crm-page max-w-4xl">
      <Link
        to="/classes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 hover:underline mb-4"
      >
        <ArrowLeft size={18} />
        Danh sách lớp
      </Link>

      {/* Header card */}
      <div className="crm-card crm-card-padding mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {classData.name}
              </h1>
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  Đang mở
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
                  <Lock size={14} /> Đã đóng
                  {classData.closedAt && (
                    <span className="opacity-90">
                      {new Date(classData.closedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Giảng viên:</span>
              <Link
                to={`/accounts/${classData.teacher.id}`}
                className="hover:text-crm-accent hover:underline"
              >
                {classData.teacher.firstName} {classData.teacher.lastName}
              </Link>
              {classData.teacher.email && (
                <a
                  href={`mailto:${classData.teacher.email}`}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-crm-accent"
                >
                  <Mail size={14} />
                  {classData.teacher.email}
                </a>
              )}
            </div>
          </div>
          {isOpen && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="crm-btn-primary"
              >
                <UserPlus size={18} />
                Thêm học viên
              </button>
              <Link to={`/classes/${id}/edit`} className="crm-btn-secondary">
                Sửa lớp
              </Link>
              <button
                type="button"
                onClick={closeClass}
                disabled={closing}
                className="crm-btn-ghost text-amber-700 hover:bg-amber-50 min-w-0 px-4"
              >
                {closing ? 'Đang xử lý...' : 'Đóng lớp'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Học viên trong lớp: đã kích hoạt (có TK) + chưa kích hoạt (từ đơn đăng ký, chưa có TK) */}
      {(() => {
        const approvedGuests = (classData.guestRequests ?? []).filter((r) => r.status === 'APPROVED');
        const totalInClass = classData.members.length + approvedGuests.length;
        const hasActivated = classData.members.length > 0;
        const hasInactive = approvedGuests.length > 0;
        return (
          <div className="crm-card overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Học viên trong lớp
                <span className="text-slate-500 font-normal ml-2">({totalInClass})</span>
              </h2>
              {isOpen && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="crm-btn-primary text-sm"
                >
                  <UserPlus size={18} />
                  Thêm học viên
                </button>
              )}
            </div>
            {totalInClass === 0 ? (
              <div className="crm-empty-state py-12">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">Chưa có học viên nào</p>
                <p className="text-slate-500 text-sm mt-1">
                  {isOpen ? 'Thêm học viên có tài khoản hoặc duyệt đơn đăng ký từ web.' : 'Lớp đã đóng.'}
                </p>
                {isOpen && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 crm-btn-primary"
                  >
                    <UserPlus size={18} />
                    Thêm học viên
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Đã kích hoạt tài khoản */}
                <div className="p-4 sm:px-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    Học viên đã kích hoạt tài khoản
                    <span className="text-slate-500 font-normal">({classData.members.length})</span>
                  </h3>
                  {!hasActivated ? (
                    <p className="text-sm text-slate-500 py-2">Chưa có</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {classData.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0 hover:bg-slate-50/50 transition-colors -mx-2 px-2 rounded-lg"
                        >
                          <Link
                            to={`/accounts/${m.user.id}`}
                            className="min-w-0 flex-1 flex flex-wrap items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                              {m.user.firstName?.slice(0, 1)}
                              {m.user.lastName?.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {m.user.firstName} {m.user.lastName}
                              </p>
                              <p className="text-sm text-slate-500 truncate">{m.user.email}</p>
                            </div>
                          </Link>
                          {m.user.phone && (
                            <a
                              href={`tel:${m.user.phone}`}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone size={14} />
                              {m.user.phone}
                            </a>
                          )}
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => removeMember(m.user.id)}
                              disabled={removingId === m.user.id}
                              className="crm-btn-ghost text-red-600 hover:bg-red-50 shrink-0"
                              title="Xóa khỏi lớp"
                              aria-label={`Xóa ${m.user.firstName} khỏi lớp`}
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Chưa kích hoạt tài khoản (từ đơn đăng ký) */}
                <div className="p-4 sm:px-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    Học viên chưa kích hoạt tài khoản
                    <span className="text-slate-500 font-normal">({approvedGuests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">Từ đơn đăng ký lớp (chưa có tài khoản trên hệ thống)</p>
                  {!hasInactive ? (
                    <p className="text-sm text-slate-500 py-2">Chưa có</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {approvedGuests.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0 hover:bg-slate-50/50 transition-colors -mx-2 px-2 rounded-lg"
                        >
                          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm shrink-0">
                              {r.fullName?.trim().slice(0, 1) || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">{r.fullName}</p>
                              <a href={`mailto:${r.email}`} className="text-sm text-slate-500 hover:text-crm-accent truncate block">
                                {r.email}
                              </a>
                              {r.phone && (
                                <a
                                  href={`tel:${r.phone}`}
                                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone size={12} />
                                  {r.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Người đăng ký (chưa có tài khoản) – chia Chờ duyệt / Đã duyệt / Đã từ chối */}
      <div className="crm-card overflow-hidden mt-6">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Người đăng ký (chưa có tài khoản)
            <span className="text-slate-500 font-normal ml-2">
              ({(classData.guestRequests?.length ?? 0)})
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Học offline: khách gửi form từ Lịch học. Khi duyệt: gửi email; nếu đã có tài khoản → thêm vào "Học viên đã kích hoạt", chưa có TK → hiển thị ở "Học viên chưa kích hoạt".
          </p>
        </div>
        {(!classData.guestRequests?.length) ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Chưa có đăng ký nào.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(() => {
              const requests = classData.guestRequests ?? [];
              const pending = requests.filter((r) => r.status === 'PENDING' || r.status === 'CONTACTED');
              const approved = requests.filter((r) => r.status === 'APPROVED');
              const rejected = requests.filter((r) => r.status === 'REJECTED');
              type RowMode = 'pending' | 'approved' | 'rejected';
              const renderRow = (req: (typeof requests)[0], mode: RowMode) => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">{req.fullName}</td>
                  <td className="py-3 px-4 space-y-2">
                    <a href={`mailto:${req.email}`} className="text-crm-accent hover:underline">{req.email}</a>
                    {req.phone && (
                      <span className="block text-xs text-slate-500">
                        <Phone size={12} className="inline" /> {req.phone}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{req.className || classData.name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {req.classDate
                      ? new Date(req.classDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {mode === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={reviewingRequestId === req.id}
                            onClick={() => handleReviewRegistrationRequest(req.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check size={14} /> Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={reviewingRequestId === req.id}
                            onClick={() => handleReviewRegistrationRequest(req.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <X size={14} /> Từ chối
                          </button>
                        </>
                      )}
                      {mode === 'approved' && (
                        <button
                          type="button"
                          disabled={revertingRequestId === req.id}
                          onClick={() => handleRevertRegistrationRequest(req.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          title="Chuyển về chờ duyệt và bỏ khỏi lớp"
                        >
                          <RotateCcw size={14} /> Hoàn duyệt
                        </button>
                      )}
                      {(mode === 'pending' || mode === 'approved' || mode === 'rejected') && (
                        <button
                          type="button"
                          disabled={deletingRequestId === req.id}
                          onClick={() => handleDeleteRegistrationRequest(req.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title="Xóa đơn đăng ký"
                        >
                          <Trash2 size={14} /> Xóa đơn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              return (
                <>
                  {pending.length > 0 && (
                    <div className="p-4 sm:px-6">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        Chờ duyệt ({pending.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="py-2 px-2 font-medium text-slate-700">Họ tên</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Liên hệ</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Lớp</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày học</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày gửi</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>{pending.map((r) => renderRow(r, 'pending'))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {approved.length > 0 && (
                    <div className="p-4 sm:px-6">
                      <h3 className="text-sm font-semibold text-emerald-800 mb-2">Đã duyệt ({approved.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="py-2 px-2 font-medium text-slate-700">Họ tên</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Liên hệ</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Lớp</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày học</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày gửi</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>{approved.map((r) => renderRow(r, 'approved'))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {rejected.length > 0 && (
                    <div className="p-4 sm:px-6">
                      <h3 className="text-sm font-semibold text-slate-600 mb-2">Đã từ chối ({rejected.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="py-2 px-2 font-medium text-slate-700">Họ tên</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Liên hệ</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Lớp</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày học</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Ngày gửi</th>
                              <th className="py-2 px-2 font-medium text-slate-700">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>{rejected.map((r) => renderRow(r, 'rejected'))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal thêm học viên */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          onClick={() => setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 id="modal-title" className="text-lg font-semibold text-slate-900">
                Thêm học viên vào lớp
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="crm-btn-ghost rounded-full"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-hidden flex flex-col min-h-0">
              {studentsForAdd.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">
                  Không còn học viên nào để thêm (hoặc bạn chỉ thấy học viên thuộc lớp mình).
                </p>
              ) : (
                <>
                  <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Tìm theo tên, email..."
                      className="crm-input pl-9"
                      aria-label="Tìm học viên"
                    />
                  </div>
                  <ul className="overflow-y-auto flex-1 min-h-0 space-y-1 -mx-1">
                    {filteredStudents.length === 0 ? (
                      <li className="py-6 text-center text-slate-500 text-sm">
                        Không tìm thấy học viên phù hợp
                      </li>
                    ) : (
                      filteredStudents.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-sm text-slate-500 truncate">{u.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addMember(u.id)}
                            disabled={addingUserId === u.id}
                            className="crm-btn-primary text-sm py-1.5 px-3 min-h-0 shrink-0"
                          >
                            {addingUserId === u.id ? 'Đang thêm...' : 'Thêm'}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
