import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  User,
  Users,
  Calendar as CalendarIcon,
  Mail,
  UserPlus,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Button from '@/components/ui/Button';
import { scheduleApi, type ScheduleClassItem } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 22;
const ROW_HEIGHT = 52;

function formatTime(s: string | null): string {
  if (!s) return '—';
  const [h, m] = s.split(':');
  return `${h}:${m || '00'}`;
}

function formatDays(days: number[]): string {
  if (!days?.length) return '—';
  return days.map((d) => DAY_LABELS[d] ?? `Thứ ${d + 1}`).join(', ');
}

/** Parse "HH:mm" to minutes from midnight */
function timeToMinutes(s: string | null): number {
  if (!s) return 0;
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Event for calendar: one class on one day at one time slot */
type CalendarEvent = {
  classItem: ScheduleClassItem;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
};

function buildCalendarEvents(classes: ScheduleClassItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const startBound = CALENDAR_START_HOUR * 60;
  const endBound = CALENDAR_END_HOUR * 60;

  for (const c of classes) {
    const startMin = timeToMinutes(c.scheduleStartTime);
    const endMin = timeToMinutes(c.scheduleEndTime);
    if (endMin <= startMin) continue;
    const days = c.scheduleDayOfWeek ?? [];
    for (const d of days) {
      if (d >= 0 && d <= 6) {
        events.push({
          classItem: c,
          dayOfWeek: d,
          startMinutes: startMin,
          endMinutes: endMin,
        });
      }
    }
  }
  return events;
}

/** Get Monday of the week for a given date (week starts Monday) */
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const d = (x: Date) => x.getDate() + '/' + (x.getMonth() + 1);
  return `${d(weekStart)} – ${d(end)}`;
}

/** Trả về ngày (trong tuần weekStart) cho cột thứ colIndex. colIndex 0=T2, 1=T3, ..., 6=CN */
function getDateForColumn(weekStart: Date, colIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + (colIndex === 6 ? 6 : colIndex));
  return d;
}

function formatDayShort(date: Date): string {
  return date.getDate() + '/' + (date.getMonth() + 1);
}

/** Format ngày đầy đủ: "Thứ 4, 29/1/2025" */
function formatDateLong(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const dayOfWeek = date.getDay();
  const dayName = DAY_LABELS[dayOfWeek] ?? `Thứ ${dayOfWeek + 1}`;
  return `${dayName}, ${d}/${m}/${y}`;
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ScheduleClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedClass, setSelectedClass] = useState<ScheduleClassItem | null>(null);
  /** Ngày cụ thể khi đăng ký (từ ô lịch tuần). Null nếu mở từ danh sách. */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [guestModal, setGuestModal] = useState<{
    classId: string;
    name: string;
    selectedDate: Date | null;
    scheduleStartTime: string | null;
    scheduleEndTime: string | null;
  } | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestSent, setGuestSent] = useState(false);
  const [guestError, setGuestError] = useState('');

  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

  const getMemberCount = (c: ScheduleClassItem) => c.memberCount ?? c._count?.members ?? 0;
  const isClassFull = (c: ScheduleClassItem) =>
    c.maxMembers != null && getMemberCount(c) >= c.maxMembers;

  const calendarEvents = useMemo(() => buildCalendarEvents(classes), [classes]);
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = CALENDAR_START_HOUR; i < CALENDAR_END_HOUR; i++) h.push(i);
    return h;
  }, []);

  async function refetchClasses() {
    const r = await scheduleApi.getClasses();
    setClasses(r.items || []);
    return r.items || [];
  }

  useEffect(() => {
    scheduleApi
      .getClasses()
      .then((r) => setClasses(r.items || []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(classId: string) {
    setJoiningId(classId);
    try {
      await scheduleApi.joinClass(classId);
      const items = await refetchClasses();
      const updated = items.find((c) => c.id === classId);
      if (updated) setSelectedClass(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Đăng ký thất bại.');
    } finally {
      setJoiningId(null);
    }
  }

  function openGuestModal(c: ScheduleClassItem, date?: Date | null) {
    setSelectedClass(null);
    setGuestModal({
      classId: c.id,
      name: c.name,
      selectedDate: date ?? selectedDate ?? null,
      scheduleStartTime: c.scheduleStartTime ?? null,
      scheduleEndTime: c.scheduleEndTime ?? null,
    });
  }

  function closePanel() {
    setSelectedClass(null);
    setSelectedDate(null);
  }

  async function handleGuestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!guestModal) return;
    setGuestError('');
    setGuestSubmitting(true);
    const form = e.currentTarget;
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim();
    const fullName = (form.querySelector('[name="fullName"]') as HTMLInputElement)?.value?.trim();
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim();
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement)?.value?.trim();
    if (!email || !fullName) {
      setGuestError('Email và họ tên là bắt buộc.');
      setGuestSubmitting(false);
      return;
    }
    try {
      await scheduleApi.registerRequest(guestModal.classId, {
        email,
        fullName,
        phone: phone || undefined,
        message: message || undefined,
        className: guestModal.name || undefined,
        classDate: guestModal.selectedDate ? guestModal.selectedDate.toISOString() : undefined,
      });
      setGuestSent(true);
      refetchClasses();
      setTimeout(() => {
        setGuestModal(null);
        setGuestSent(false);
      }, 2000);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Gửi thất bại.');
    } finally {
      setGuestSubmitting(false);
    }
  }

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const isCurrentWeek =
    viewMode === 'calendar' &&
    weekStart.getTime() === getWeekStart(new Date()).getTime();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <Breadcrumb currentLabel="Lịch học" />
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-accent-600 font-semibold text-sm uppercase tracking-wider mb-2">
              Lịch khai giảng
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-3">
              Lịch học các lớp
            </h1>
            <p className="text-primary-600 text-base">
              Xem lịch theo tuần hoặc danh sách. Bấm vào lớp để xem chi tiết và đăng ký.
            </p>
          </div>

          {loading ? (
            <div className="mt-10 flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 border-2 border-primary-200 border-t-accent-500 rounded-full animate-spin" />
              <span className="mt-4 text-sm text-primary-500">Đang tải lịch...</span>
            </div>
          ) : classes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 text-center py-16 px-6 rounded-2xl bg-white border border-primary-200 shadow-sm max-w-md mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5">
                <CalendarIcon className="h-8 w-8 text-primary-400" />
              </div>
              <p className="text-primary-800 font-semibold text-lg">Chưa có lịch lớp nào</p>
              <p className="text-primary-500 text-sm mt-2 leading-relaxed">
                Lịch sẽ được cập nhật theo từng kỳ. Bạn có thể đăng ký học thử hoặc liên hệ để được tư vấn.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Toolbar: view toggle + week nav */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex rounded-2xl bg-white border border-primary-200 p-1.5 shadow-sm ring-1 ring-primary-100">
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      viewMode === 'calendar'
                        ? 'bg-accent-500 text-primary-900 shadow-sm'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <LayoutGrid size={18} strokeWidth={2.5} />
                    Lịch tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-accent-500 text-primary-900 shadow-sm'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <List size={18} strokeWidth={2.5} />
                    Danh sách
                  </button>
                </div>

                {viewMode === 'calendar' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={prevWeek}
                      className="p-2.5 rounded-xl border border-primary-200 bg-white text-primary-600 hover:bg-primary-50 hover:border-primary-300 transition-colors"
                      aria-label="Tuần trước"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span
                      className={`min-w-[150px] text-center text-sm font-semibold px-3 py-2 rounded-xl ${
                        isCurrentWeek ? 'bg-accent-500/20 text-primary-900' : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {getWeekLabel(weekStart)}
                    </span>
                    <button
                      type="button"
                      onClick={nextWeek}
                      className="p-2.5 rounded-xl border border-primary-200 bg-white text-primary-600 hover:bg-primary-50 hover:border-primary-300 transition-colors"
                      aria-label="Tuần sau"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <Button
                      type="button"
                      variant={isCurrentWeek ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={goToday}
                    >
                      Hôm nay
                    </Button>
                  </div>
                )}
              </div>

              {/* Calendar week view (Google-style) */}
              {viewMode === 'calendar' && (
                <div className="rounded-2xl border border-primary-200 bg-white shadow-lg overflow-hidden ring-1 ring-primary-100/50">
                  <div className="overflow-x-auto">
                    <div
                      className="min-w-[640px] grid grid-cols-[56px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] grid-rows-[52px_minmax(0,780px)]"
                    >
                      {/* Row 1: headers (thứ + ngày theo tuần đang chọn) */}
                      <div className="p-2 border-b border-r border-primary-200 bg-gradient-to-b from-primary-50 to-primary-100/80" />
                      {[1, 2, 3, 4, 5, 6, 0].map((dayIndex, colIndex) => {
                        const dayDate = getDateForColumn(weekStart, colIndex);
                        return (
                          <div
                            key={`${dayIndex}-${weekStart.getTime()}`}
                            className="py-2.5 px-1 text-center border-b border-r border-primary-200 bg-gradient-to-b from-primary-50 to-primary-100/80 last:border-r-0"
                          >
                            <span className="block text-xs font-bold text-primary-800">
                              {DAY_SHORT[dayIndex]}
                            </span>
                            <span className="block text-[11px] text-primary-500 mt-0.5 tabular-nums">
                              {formatDayShort(dayDate)}
                            </span>
                          </div>
                        );
                      })}
                      {/* Row 2: time column */}
                      <div
                        className="flex flex-col border-r border-primary-200 bg-primary-50/60"
                        style={{ height: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * ROW_HEIGHT }}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="flex-shrink-0 text-xs text-primary-500 pr-2 text-right border-t border-primary-100/80 first:border-t-0 tabular-nums"
                            style={{ height: ROW_HEIGHT }}
                          >
                            <span className="inline-block -mt-2.5">{h}:00</span>
                          </div>
                        ))}
                      </div>
                      {/* Row 2: day columns with events */}
                      {[1, 2, 3, 4, 5, 6, 0].map((dayIndex, colIndex) => (
                        <div
                          key={dayIndex}
                          className="relative border-r border-primary-100 last:border-r-0 bg-white"
                          style={{
                            height: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * ROW_HEIGHT,
                          }}
                        >
                          {hours.map((h) => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-primary-100/80"
                              style={{
                                top: (h - CALENDAR_START_HOUR) * ROW_HEIGHT,
                                height: ROW_HEIGHT,
                              }}
                            />
                          ))}
                          {calendarEvents
                            .filter((ev) => ev.dayOfWeek === dayIndex)
                            .map((ev) => {
                              const topPx = Math.max(
                                0,
                                ((ev.startMinutes - CALENDAR_START_HOUR * 60) / 60) * ROW_HEIGHT + 2,
                              );
                              const heightPx = Math.max(
                                28,
                                ((ev.endMinutes - ev.startMinutes) / 60) * ROW_HEIGHT - 3,
                              );
                              const slotDate = getDateForColumn(weekStart, colIndex);
                              return (
                                <button
                                  key={`${ev.classItem.id}-${dayIndex}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedClass(ev.classItem);
                                    setSelectedDate(slotDate);
                                  }}
                                  className="absolute left-1 right-1 rounded-lg bg-accent-500 hover:bg-accent-600 text-primary-900 text-left overflow-hidden flex flex-col justify-center pl-2.5 pr-2 py-1.5 border-l-4 border-accent-700 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
                                  style={{
                                    top: topPx,
                                    height: heightPx,
                                    minHeight: 28,
                                  }}
                                >
                                  <span className="text-xs font-bold truncate leading-tight">
                                    {ev.classItem.name}
                                  </span>
                                  <span className="text-[10px] opacity-90 truncate leading-tight mt-0.5">
                                    {formatTime(ev.classItem.scheduleStartTime)} –{' '}
                                    {formatTime(ev.classItem.scheduleEndTime)}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* List view: card trên mobile, bảng trên desktop */}
              {viewMode === 'list' && (
                <>
                  {/* Mobile: card list */}
                  <div className="md:hidden space-y-4">
                    {classes.map((c, idx) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setSelectedClass(c); setSelectedDate(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && (setSelectedClass(c), setSelectedDate(null))}
                        className="rounded-2xl border border-primary-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group"
                      >
                        <div className="h-1 w-full bg-gradient-to-r from-accent-500 to-accent-400" />
                        <div className="p-5">
                          <div className="font-bold text-primary-900 text-lg mb-3 group-hover:text-accent-700 transition-colors">
                            {c.name}
                          </div>
                          <ul className="space-y-2 text-sm text-primary-600">
                            <li className="flex items-center gap-2">
                              <User className="h-4 w-4 text-accent-500 shrink-0" />
                              {c.teacher.firstName} {c.teacher.lastName}
                            </li>
                            <li className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-accent-500 shrink-0" />
                              {formatTime(c.scheduleStartTime)} – {formatTime(c.scheduleEndTime)}
                            </li>
                            <li>{formatDays(c.scheduleDayOfWeek || [])}</li>
                            {c.room && (
                              <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-accent-500 shrink-0" />
                                {c.room}
                              </li>
                            )}
                            <li className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-accent-500 shrink-0" />
                              {getMemberCount(c)}
                              {c.maxMembers != null ? ` / ${c.maxMembers}` : ''} học viên
                            </li>
                          </ul>
                          <p className="text-xs text-primary-400 mt-3">Bấm để xem chi tiết</p>
                          <div className="mt-4 pt-4 border-t border-primary-100" onClick={(e) => e.stopPropagation()}>
                            {isClassFull(c) ? (
                              <p className="text-xs text-amber-700 text-center py-1.5 font-medium">Lớp đã đủ — không nhận đăng ký</p>
                            ) : isStudent ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full"
                                disabled={joiningId === c.id}
                                onClick={() => handleJoin(c.id)}
                              >
                                {joiningId === c.id ? 'Đang xử lý...' : 'Đăng ký vào lớp'}
                              </Button>
                            ) : isTeacher ? (
                              <p className="text-xs text-primary-500 text-center py-1">Giảng viên — chỉ xem lịch</p>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full"
                                onClick={() => openGuestModal(c, null)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Gửi đăng ký
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-primary-200 bg-white shadow-lg ring-1 ring-primary-100/50">
                    <table className="w-full table-fixed" style={{ minWidth: 720 }}>
                      <thead>
                        <tr className="border-b-2 border-primary-200 bg-primary-50">
                          <th className="text-left py-4 px-5 w-[20%] text-sm font-bold text-primary-800">
                            Lớp
                          </th>
                          <th className="text-left py-4 px-5 w-[16%] text-sm font-bold text-primary-800">
                            Giảng viên
                          </th>
                          <th className="text-left py-4 px-5 w-[14%] text-sm font-bold text-primary-800">
                            Giờ học
                          </th>
                          <th className="text-left py-4 px-5 w-[18%] text-sm font-bold text-primary-800">
                            Thứ
                          </th>
                          <th className="text-left py-4 px-5 w-[12%] text-sm font-bold text-primary-800">
                            Phòng
                          </th>
                          <th className="text-left py-4 px-5 w-[10%] text-sm font-bold text-primary-800">
                            Sĩ số
                          </th>
                          <th className="text-right py-4 px-5 w-[10%] text-sm font-bold text-primary-800">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-100">
                        {classes.map((c, idx) => (
                          <tr
                            key={c.id}
                            className={`hover:bg-accent-50/50 transition-colors cursor-pointer ${
                              idx % 2 === 1 ? 'bg-primary-50/30' : ''
                            }`}
                            onClick={() => { setSelectedClass(c); setSelectedDate(null); }}
                          >
                            <td className="py-4 px-5 font-semibold text-primary-900 truncate" title={c.name}>
                              {c.name}
                            </td>
                            <td className="py-4 px-5 text-primary-600 truncate">
                              <span className="inline-flex items-center gap-1.5">
                                <User className="h-4 w-4 shrink-0 text-accent-500" />
                                {c.teacher.firstName} {c.teacher.lastName}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-primary-600 truncate tabular-nums">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-4 w-4 shrink-0 text-accent-500" />
                                {formatTime(c.scheduleStartTime)} – {formatTime(c.scheduleEndTime)}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-primary-600 truncate">
                              {formatDays(c.scheduleDayOfWeek || [])}
                            </td>
                            <td className="py-4 px-5 text-primary-600 truncate">
                              {c.room ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 shrink-0 text-accent-500" />
                                  {c.room}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-4 px-5 text-primary-600 truncate tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-4 w-4 shrink-0 text-accent-500" />
                                {getMemberCount(c)}
                                {c.maxMembers != null ? ` / ${c.maxMembers}` : ''}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              {isClassFull(c) ? (
                                <span className="text-xs text-amber-700 font-medium">Lớp đã đủ</span>
                              ) : isStudent ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={joiningId === c.id}
                                  onClick={() => handleJoin(c.id)}
                                >
                                  {joiningId === c.id ? '...' : 'Đăng ký'}
                                </Button>
                              ) : isTeacher ? (
                                <span className="text-xs text-primary-500">Chỉ xem</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openGuestModal(c, null)}
                                >
                                  Gửi đăng ký
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!authLoading && !user && (
                <div className="rounded-xl bg-primary-100/80 border border-primary-200 px-4 py-3 text-center">
                  <p className="text-sm text-primary-700">
                    Đã có tài khoản?{' '}
                    <a
                      href="/dang-nhap"
                      className="font-semibold text-accent-600 hover:text-accent-700 underline underline-offset-2"
                    >
                      Đăng nhập
                    </a>{' '}
                    để đăng ký trực tiếp vào lớp.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Detail panel: class info when clicking a class */}
      <AnimatePresence>
        {selectedClass && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closePanel}
              aria-hidden
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col rounded-l-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-primary-50 border-b border-primary-200">
                <h2 className="text-base font-bold text-primary-800">Chi tiết lớp học</h2>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2.5 rounded-xl text-primary-500 hover:bg-primary-200 hover:text-primary-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-6">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-accent-500/20 text-accent-800 text-xs font-semibold mb-2">
                    Lớp mở đăng ký
                  </span>
                  <h3 className="text-xl font-bold text-primary-900 leading-tight">
                    {selectedClass.name}
                  </h3>
                </div>
                <div className="rounded-xl bg-primary-50/80 border border-primary-100 p-4 space-y-3">
                  <div className="flex items-center gap-3 text-primary-700">
                    <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Giảng viên</p>
                      <p className="font-medium">
                        {selectedClass.teacher.firstName} {selectedClass.teacher.lastName}
                      </p>
                    </div>
                  </div>
                  {selectedDate && (
                    <div className="flex items-center gap-3 text-primary-700 rounded-lg bg-accent-100/60 border border-accent-200/60 p-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                        <CalendarIcon className="h-4 w-4 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-accent-800 uppercase tracking-wide">Ngày đăng ký</p>
                        <p className="font-semibold text-primary-900">
                          {formatDateLong(selectedDate)}, {formatTime(selectedClass.scheduleStartTime)} –{' '}
                          {formatTime(selectedClass.scheduleEndTime)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-primary-700">
                    <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Giờ học</p>
                      <p className="font-medium tabular-nums">
                        {formatTime(selectedClass.scheduleStartTime)} –{' '}
                        {formatTime(selectedClass.scheduleEndTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-primary-700">
                    <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-4 w-4 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Thứ</p>
                      <p className="font-medium">{formatDays(selectedClass.scheduleDayOfWeek || [])}</p>
                    </div>
                  </div>
                  {selectedClass.room && (
                    <div className="flex items-center gap-3 text-primary-700">
                      <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Phòng</p>
                        <p className="font-medium">{selectedClass.room}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-primary-700">
                    <div className="w-9 h-9 rounded-lg bg-accent-500/20 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">Sĩ số</p>
                      <p className="font-medium tabular-nums">
                        {getMemberCount(selectedClass)}
                        {selectedClass.maxMembers != null ? ` / ${selectedClass.maxMembers}` : ''} học viên
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  {isClassFull(selectedClass) ? (
                    <p className="text-sm text-amber-700 text-center py-2 font-medium bg-amber-50 rounded-xl border border-amber-200">
                      Lớp đã đủ số lượng. Không nhận đăng ký mới. Khi có học viên hủy lớp, bạn có thể đăng ký.
                    </p>
                  ) : isStudent ? (
                    <Button
                      className="w-full py-3 text-base font-semibold"
                      variant="primary"
                      disabled={joiningId === selectedClass.id}
                      onClick={() => handleJoin(selectedClass.id)}
                    >
                      {joiningId === selectedClass.id ? 'Đang xử lý...' : 'Đăng ký vào lớp'}
                    </Button>
                  ) : isTeacher ? (
                    <p className="text-sm text-primary-600 text-center py-2">Giảng viên chỉ xem lịch, không đăng ký lớp.</p>
                  ) : (
                    <Button
                      className="w-full py-3 text-base font-semibold"
                      variant="primary"
                      onClick={() => openGuestModal(selectedClass, selectedDate)}
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      Gửi đăng ký (chưa có tài khoản)
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={closePanel}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal gửi đăng ký (khách) */}
      {guestModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !guestSubmitting && setGuestModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-primary-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-primary-900">
                  <UserPlus className="inline h-5 w-5 mr-2 text-accent-500" />
                  Đăng ký lớp: {guestModal.name}
                </h3>
                {guestModal.selectedDate && (
                  <p className="text-sm text-primary-600 mt-1">
                    {formatDateLong(guestModal.selectedDate)}
                    {guestModal.scheduleStartTime != null && guestModal.scheduleEndTime != null && (
                      <span className="tabular-nums"> · {formatTime(guestModal.scheduleStartTime)} – {formatTime(guestModal.scheduleEndTime)}</span>
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => !guestSubmitting && setGuestModal(null)}
                className="p-2.5 rounded-xl text-primary-500 hover:bg-primary-200 hover:text-primary-800"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            {guestSent ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-7 w-7 text-accent-600" />
                </div>
                <p className="text-primary-800 font-semibold text-lg">Đã gửi đăng ký thành công</p>
                <p className="text-primary-500 text-sm mt-2">Chúng tôi sẽ liên hệ bạn sớm.</p>
              </div>
            ) : (
              <form onSubmit={handleGuestSubmit} className="p-6 space-y-4">
                {guestModal.selectedDate && (
                  <div className="rounded-xl bg-accent-50 border border-accent-200/80 px-4 py-3 text-sm text-primary-800">
                    <span className="font-medium">Buổi đăng ký: </span>
                    {formatDateLong(guestModal.selectedDate)}
                    {guestModal.scheduleStartTime != null && guestModal.scheduleEndTime != null && (
                      <span className="tabular-nums"> · {formatTime(guestModal.scheduleStartTime)} – {formatTime(guestModal.scheduleEndTime)}</span>
                    )}
                  </div>
                )}
                {guestError && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100" role="alert">
                    {guestError}
                  </div>
                )}
                <div>
                  <label htmlFor="guest-fullName" className="block text-sm font-semibold text-primary-700 mb-1.5">
                    Họ tên *
                  </label>
                  <input
                    id="guest-fullName"
                    name="fullName"
                    type="text"
                    required
                    className="w-full rounded-xl border border-primary-300 px-4 py-3 text-primary-900 placeholder:text-primary-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-shadow"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label htmlFor="guest-email" className="block text-sm font-semibold text-primary-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    id="guest-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-primary-300 px-4 py-3 text-primary-900 placeholder:text-primary-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-shadow"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="guest-phone" className="block text-sm font-semibold text-primary-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    id="guest-phone"
                    name="phone"
                    type="tel"
                    className="w-full rounded-xl border border-primary-300 px-4 py-3 text-primary-900 placeholder:text-primary-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-shadow"
                    placeholder="0900 123 456"
                  />
                </div>
                <div>
                  <label htmlFor="guest-message" className="block text-sm font-semibold text-primary-700 mb-1.5">
                    Lời nhắn
                  </label>
                  <textarea
                    id="guest-message"
                    name="message"
                    rows={2}
                    className="w-full rounded-xl border border-primary-300 px-4 py-3 text-primary-900 placeholder:text-primary-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-shadow resize-none"
                    placeholder="Khung giờ mong muốn, trình độ..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={guestSubmitting} variant="primary" className="flex-1 py-3">
                    {guestSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setGuestModal(null)}
                    disabled={guestSubmitting}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
