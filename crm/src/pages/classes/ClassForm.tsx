import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { classesApi, usersApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, Clock, MapPin, Users, GraduationCap, Info } from 'lucide-react';

const DAY_OPTIONS = [
  { value: 0, label: 'CN' },
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
];

type ClassFormData = {
  name: string;
  teacherId: string;
  scheduleDayOfWeek: number[];
  scheduleStartTime: string;
  scheduleEndTime: string;
  room: string;
  maxMembers: string;
};

const defaultForm: ClassFormData = {
  name: '',
  teacherId: '',
  scheduleDayOfWeek: [],
  scheduleStartTime: '',
  scheduleEndTime: '',
  room: '',
  maxMembers: '',
};

export default function ClassForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const isNew = id === 'new' || !id;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [form, setForm] = useState<ClassFormData>(defaultForm);

  const scheduleSummary = useMemo(() => {
    const days =
      form.scheduleDayOfWeek.length > 0
        ? form.scheduleDayOfWeek
            .slice()
            .sort((a, b) => a - b)
            .map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label ?? `T${d + 1}`)
            .join(', ')
        : '';
    const time =
      form.scheduleStartTime && form.scheduleEndTime
        ? `${form.scheduleStartTime} – ${form.scheduleEndTime}`
        : '';
    if (!days && !time) return null;
    return [days, time].filter(Boolean).join(' · ') || 'Chưa chọn thứ hoặc giờ';
  }, [form.scheduleDayOfWeek, form.scheduleStartTime, form.scheduleEndTime]);

  useEffect(() => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      usersApi
        .list({ role: 'TEACHER', limit: 200 })
        .then((r) =>
          setTeachers(r.items.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })))
        )
        .catch(() => {});
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      classesApi
        .get(id)
        .then((c: {
          name: string;
          teacher?: { id: string };
          scheduleDayOfWeek?: number[] | null;
          scheduleStartTime?: string | null;
          scheduleEndTime?: string | null;
          room?: string | null;
          maxMembers?: number | null;
        }) => {
          setForm({
            name: c.name,
            teacherId: c.teacher?.id ?? '',
            scheduleDayOfWeek: Array.isArray(c.scheduleDayOfWeek) ? c.scheduleDayOfWeek : [],
            scheduleStartTime: c.scheduleStartTime ?? '',
            scheduleEndTime: c.scheduleEndTime ?? '',
            room: c.room ?? '',
            maxMembers: c.maxMembers != null ? String(c.maxMembers) : '',
          });
        })
        .catch((e) => {
          show('error', e?.message || 'Không tải được lớp');
          navigate('/classes');
        })
        .finally(() => setLoading(false));
    }
  }, [isNew, id, navigate, show]);

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      scheduleDayOfWeek: f.scheduleDayOfWeek.includes(d)
        ? f.scheduleDayOfWeek.filter((x) => x !== d)
        : [...f.scheduleDayOfWeek, d].sort((a, b) => a - b),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      show('error', 'Vui lòng nhập tên lớp');
      return;
    }
    if (form.scheduleStartTime && form.scheduleEndTime && form.scheduleStartTime >= form.scheduleEndTime) {
      show('error', 'Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    if ((form.scheduleStartTime || form.scheduleEndTime) && form.scheduleDayOfWeek.length === 0) {
      show('error', 'Vui lòng chọn ít nhất một thứ học nếu đã nhập giờ học.');
      return;
    }
    setSaving(true);
    const schedulePayload = {
      scheduleDayOfWeek: form.scheduleDayOfWeek,
      scheduleStartTime: form.scheduleStartTime.trim() || undefined,
      scheduleEndTime: form.scheduleEndTime.trim() || undefined,
      room: form.room.trim() || undefined,
      maxMembers: form.maxMembers.trim() ? parseInt(form.maxMembers, 10) : undefined,
    };
    try {
      if (isNew) {
        const payload = {
          name: form.name.trim(),
          ...(currentUser?.role === 'SUPER_ADMIN' && form.teacherId ? { teacherId: form.teacherId } : {}),
          ...schedulePayload,
        };
        await classesApi.create(payload);
        show('success', 'Đã tạo lớp.');
      } else {
        const payload = {
          name: form.name.trim(),
          ...(currentUser?.role === 'SUPER_ADMIN' && form.teacherId ? { teacherId: form.teacherId } : {}),
          ...schedulePayload,
        };
        await classesApi.update(id!, payload);
        show('success', 'Đã cập nhật lớp.');
      }
      navigate('/classes');
    } catch (e: unknown) {
      show('error', e instanceof Error ? e.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="crm-page flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-crm-accent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page max-w-2xl">
      <Link
        to="/classes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 hover:underline mb-6"
      >
        <ArrowLeft size={18} />
        Danh sách lớp
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-crm-accent/10 flex items-center justify-center shrink-0">
          <GraduationCap size={24} className="text-crm-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? 'Thêm lớp mới' : 'Chỉnh sửa lớp'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isNew
              ? 'Điền thông tin bên dưới. Lịch học sẽ hiển thị trên trang Lịch học của website.'
              : 'Cập nhật thông tin lớp. Thay đổi lịch sẽ cập nhật ngay trên website.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <section className="crm-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap size={18} className="text-crm-accent" />
              Thông tin cơ bản
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tên lớp và giảng viên phụ trách</p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label htmlFor="class-name" className="block text-sm font-medium text-slate-700 mb-2">
                Tên lớp <span className="text-red-500">*</span>
              </label>
              <input
                id="class-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="crm-input w-full text-base"
                placeholder="Ví dụ: Lớp HSK1 - Thứ 3, 5"
                autoFocus
              />
            </div>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <div>
                <label htmlFor="class-teacher" className="block text-sm font-medium text-slate-700 mb-2">
                  Giảng viên phụ trách
                </label>
                <select
                  id="class-teacher"
                  value={form.teacherId}
                  onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                  className="crm-select w-full"
                >
                  <option value="">— Chọn giảng viên —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
                {isNew && !form.teacherId && (
                  <p className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <Info size={14} className="shrink-0" />
                    Để trống thì lớp do bạn (Super Admin) phụ trách.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Lịch học */}
        <section className="crm-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-crm-accent" />
              Lịch học
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chọn thứ và khung giờ. Sẽ hiển thị trên trang Lịch học (website).
            </p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Thứ trong tuần</label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`min-w-[44px] min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-crm-accent ${
                      form.scheduleDayOfWeek.includes(value)
                        ? 'border-crm-accent bg-crm-accent/15 text-crm-accent'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="class-start-time" className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock size={14} className="inline mr-1.5 align-middle" />
                  Giờ bắt đầu
                </label>
                <input
                  id="class-start-time"
                  type="time"
                  value={form.scheduleStartTime}
                  onChange={(e) => setForm((f) => ({ ...f, scheduleStartTime: e.target.value }))}
                  className="crm-input w-full"
                />
              </div>
              <div>
                <label htmlFor="class-end-time" className="block text-sm font-medium text-slate-700 mb-2">
                  Giờ kết thúc
                </label>
                <input
                  id="class-end-time"
                  type="time"
                  value={form.scheduleEndTime}
                  onChange={(e) => setForm((f) => ({ ...f, scheduleEndTime: e.target.value }))}
                  className="crm-input w-full"
                />
              </div>
            </div>
            {scheduleSummary && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3">
                <p className="text-xs font-medium text-emerald-800 mb-0.5">Sẽ hiển thị trên website</p>
                <p className="text-sm text-emerald-700 font-medium">{scheduleSummary}</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Phòng & sĩ số */}
        <section className="crm-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <MapPin size={18} className="text-crm-accent" />
              Phòng & sĩ số
            </h2>
            <p className="text-xs text-slate-500 mt-1">Phòng học và giới hạn số lượng học viên (tùy chọn)</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="class-room" className="block text-sm font-medium text-slate-700 mb-2">
                  Phòng học
                </label>
                <input
                  id="class-room"
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  className="crm-input w-full"
                  placeholder="Ví dụ: P.101"
                />
              </div>
              <div>
                <label htmlFor="class-max-members" className="block text-sm font-medium text-slate-700 mb-2">
                  <Users size={14} className="inline mr-1.5 align-middle" />
                  Sĩ số tối đa
                </label>
                <input
                  id="class-max-members"
                  type="number"
                  min={1}
                  value={form.maxMembers}
                  onChange={(e) => setForm((f) => ({ ...f, maxMembers: e.target.value }))}
                  className="crm-input w-full"
                  placeholder="Để trống = không giới hạn"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="crm-btn-primary min-w-[140px]">
            {saving ? 'Đang lưu...' : isNew ? 'Tạo lớp' : 'Lưu thay đổi'}
          </button>
          <Link to="/classes" className="crm-btn-secondary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
