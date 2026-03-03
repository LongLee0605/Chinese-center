import { useState, useEffect } from 'react';
import { trialRegistrationsApi, coursesApi, type TrialRegistration } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Check, X, Clock, UserPlus, BookOpen } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

export default function TrialRegistrationsList() {
  const { show } = useToast();
  const [items, setItems] = useState<TrialRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [courseIdFilter, setCourseIdFilter] = useState<string>('');
  const [courses, setCourses] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params: { status?: string; courseId?: string; limit: number } = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    if (courseIdFilter) params.courseId = courseIdFilter;
    trialRegistrationsApi
      .list(params)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, courseIdFilter]);

  useEffect(() => {
    coursesApi
      .list({ limit: 200 })
      .then((r: { items: unknown[] }) => setCourses((r.items as typeof courses) ?? []))
      .catch(() => setCourses([]));
  }, []);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !confirm('Từ chối yêu cầu học thử này?')) return;
    setReviewingId(id);
    try {
      await trialRegistrationsApi.review(id, { status });
      show('success', status === 'APPROVED' ? 'Đã duyệt. Tài khoản học thử 24h đã được tạo.' : 'Đã từ chối.');
      load();
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Thao tác thất bại.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <UserPlus size={28} className="text-emerald-600 shrink-0" />
        Đăng ký học thử
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Khách từ website gửi form học thử theo khóa. Duyệt sẽ tạo tài khoản tạm (24h) và đăng ký vào khóa tương ứng.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
        <select
          value={courseIdFilter}
          onChange={(e) => setCourseIdFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
        >
          <option value="">Tất cả khóa học</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Chưa có đăng ký học thử nào.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((reg) => (
            <li
              key={reg.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{reg.fullName}</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reg.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : reg.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[reg.status] ?? reg.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{reg.email}</p>
                  {reg.phone && <p className="text-sm text-gray-500">{reg.phone}</p>}
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700">
                    <BookOpen size={16} className="shrink-0" />
                    {reg.course.name}
                  </div>
                  {reg.message && (
                    <p className="mt-2 text-sm text-gray-600 border-l-2 border-gray-200 pl-3">{reg.message}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(reg.requestedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {reg.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={reviewingId === reg.id}
                      onClick={() => handleReview(reg.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check size={16} /> Duyệt (tạo TK 24h)
                    </button>
                    <button
                      type="button"
                      disabled={reviewingId === reg.id}
                      onClick={() => handleReview(reg.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={16} /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
