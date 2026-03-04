import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, BookOpen, Clock } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import { useSubmitLeadMutation, useSubmitTrialRegistrationMutation, useGetCoursesQuery } from '@/store/apiSlice';
import { scheduleApi, type ScheduleClassItem } from '@/lib/api';

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** Khung giờ mặc định khi không có lớp nào mở */
const FALLBACK_TIME_OPTIONS = [
  { value: 'Sáng (8h–12h)', label: 'Sáng (8h–12h)' },
  { value: 'Chiều (13h–17h)', label: 'Chiều (13h–17h)' },
  { value: 'Tối (18h–21h)', label: 'Tối (18h–21h)' },
  { value: 'Cuối tuần', label: 'Cuối tuần' },
];

function formatTime(s: string | null): string {
  if (!s) return '—';
  const [h, m] = s.split(':');
  return `${h}:${m || '00'}`;
}

/** Từ danh sách lớp mở, tạo options khung giờ: mỗi (lớp, thứ) + giờ → 1 option */
function buildTimeSlotsFromClasses(classes: ScheduleClassItem[]): { value: string; label: string }[] {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const c of classes) {
    const days = c.scheduleDayOfWeek ?? [];
    const start = formatTime(c.scheduleStartTime);
    const end = formatTime(c.scheduleEndTime);
    const timeStr = `${start}–${end}`;
    for (const d of days) {
      const dayName = DAY_LABELS[d] ?? `Thứ ${d + 1}`;
      const value = `${dayName} ${timeStr} - ${c.name}`;
      if (seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: value });
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export default function BookTrialPage() {
  const [searchParams] = useSearchParams();
  const courseSlug = searchParams.get('courseSlug')?.trim() || undefined;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [scheduleClasses, setScheduleClasses] = useState<ScheduleClassItem[]>([]);

  const [submitLead, { isLoading: submittingLead }] = useSubmitLeadMutation();
  const [submitTrialRegistration, { isLoading: submittingTrial }] = useSubmitTrialRegistrationMutation();
  const { data: coursesData } = useGetCoursesQuery(undefined, { skip: !!courseSlug });
  const submitting = submittingLead || submittingTrial;

  const courses = useMemo(() => {
    const items = coursesData?.items ?? [];
    const list = items.map((c) => ({ value: c.slug, label: c.name, id: c.id }));
    if (list.length === 0) return [{ value: 'other', label: 'Khác (để tư vấn viên gọi)', id: 'other' }];
    return list;
  }, [coursesData]);

  const timeSlotOptions = useMemo(() => {
    const fromClasses = buildTimeSlotsFromClasses(scheduleClasses);
    return fromClasses.length > 0 ? fromClasses : FALLBACK_TIME_OPTIONS;
  }, [scheduleClasses]);

  useEffect(() => {
    scheduleApi
      .getClasses()
      .then((r) => setScheduleClasses(r.items ?? []))
      .catch(() => setScheduleClasses([]));
  }, []);

  const handleSubmitTrial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseSlug) return;
    setError('');
    const form = e.currentTarget;
    const fullName = (form.querySelector('[name="fullName"]') as HTMLInputElement)?.value?.trim();
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim();
    const message = (form.querySelector('[name="message"]') as HTMLTextAreaElement)?.value?.trim();
    if (!fullName || !email) return;
    try {
      await submitTrialRegistration({
        email,
        fullName,
        phone: phone || undefined,
        courseSlug,
        message: message || undefined,
      }).unwrap();
      setSent(true);
    } catch (err: unknown) {
      const dataMessage = err && typeof err === 'object' && 'data' in err && (err as { data?: { message?: unknown } }).data?.message;
      const msg = typeof dataMessage === 'string' ? dataMessage : (err instanceof Error ? err.message : 'Gửi thất bại. Vui lòng thử lại.');
      setError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value?.trim();
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim();
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim();
    const courseValue = (form.querySelector('[name="course"]:checked') as HTMLInputElement)?.value;
    const timeCheckboxes = form.querySelectorAll('[name="time"]:checked');
    const timePreference = Array.from(timeCheckboxes)
      .map((el) => (el as HTMLInputElement).value)
      .join('; ');
    const note = (form.querySelector('[name="note"]') as HTMLTextAreaElement)?.value?.trim();
    if (!name || !phone || !email) return;
    try {
      await submitLead({
        type: 'DANG_KY_HOC_THU',
        name,
        email,
        phone,
        courseInterest: courseValue || undefined,
        timePreference: timePreference || undefined,
        note: note || undefined,
      }).unwrap();
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại. Vui lòng thử lại hoặc gọi hotline.');
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Đăng ký học thử" />
      <section className="section-padding">
        <div className="container-narrow">
          <SectionTitle
            overline={courseSlug ? 'Xem thử khóa học' : 'Miễn phí 1 buổi'}
            title="Đăng ký học thử"
            subtitle={courseSlug
              ? 'Điền form bên dưới. Khi được duyệt, bạn sẽ nhận tài khoản xem khóa học này trong 24 giờ. Sau 24h cần liên hệ để mua khóa hoặc gia hạn.'
              : 'Điền form bên dưới, chúng tôi sẽ xếp lịch học thử 1 buổi miễn phí và gọi lại xác nhận trong 24 giờ.'}
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 shadow-card"
          >
            {sent ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-lg font-semibold text-accent-600">Đăng ký thành công!</p>
                <p className="mt-2 text-primary-600 max-w-md mx-auto">
                  {courseSlug
                    ? 'Yêu cầu của bạn đã được gửi. Giảng viên sẽ xem xét và cấp tài khoản xem thử (24h) nếu được duyệt.'
                    : 'Chúng tôi sẽ liên hệ trong vòng 24 giờ để xếp lịch học thử cho bạn.'}
                </p>
                <Link to={courseSlug ? `/khoa-hoc/${courseSlug}` : '/khoa-hoc'} className="mt-6 inline-block">
                  <Button variant="outline">{courseSlug ? 'Về trang khóa học' : 'Xem khóa học'}</Button>
                </Link>
              </div>
            ) : courseSlug ? (
              <form onSubmit={handleSubmitTrial} className="space-y-5 sm:space-y-6">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <p className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
                  Khóa học: <strong>{courseSlug}</strong>
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="trial-fullName" className="block text-sm font-medium text-primary-900 mb-1.5">Họ tên *</label>
                    <input id="trial-fullName" name="fullName" type="text" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label htmlFor="trial-phone" className="block text-sm font-medium text-primary-900 mb-1.5">Số điện thoại</label>
                    <input id="trial-phone" name="phone" type="tel" className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="0901234567" />
                  </div>
                </div>
                <div>
                  <label htmlFor="trial-email" className="block text-sm font-medium text-primary-900 mb-1.5">Email *</label>
                  <input id="trial-email" name="email" type="email" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="email@example.com" />
                </div>
                <div>
                  <label htmlFor="trial-message" className="block text-sm font-medium text-primary-900 mb-1.5">Ghi chú</label>
                  <textarea id="trial-message" name="message" rows={3} className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="Trình độ hiện tại, mục tiêu học..." />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto group" disabled={submittingTrial}>
                  {submittingTrial ? 'Đang gửi...' : 'Gửi yêu cầu xem thử'}
                  <Send className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-primary-900 mb-1.5">Họ tên *</label>
                    <input id="name" name="name" type="text" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-primary-900 mb-1.5">Số điện thoại *</label>
                    <input id="phone" name="phone" type="tel" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="0901234567" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-1.5">Email *</label>
                  <input id="email" name="email" type="email" required className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[44px]" placeholder="email@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    <BookOpen className="inline h-4 w-4 mr-1.5 text-accent-500" />
                    Khóa học quan tâm *
                  </label>
                  {coursesData === undefined ? (
                    <p className="text-sm text-primary-500 py-2">Đang tải danh sách khóa học...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {courses.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 rounded-xl border border-primary-200 px-4 py-3 cursor-pointer hover:bg-primary-50 min-h-[44px] transition-colors has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50">
                          <input type="radio" name="course" value={opt.value} required className="w-4 h-4 text-accent-600 focus:ring-accent-500" />
                          <span className="text-sm font-medium text-primary-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    <Clock className="inline h-4 w-4 mr-1.5 text-accent-500" />
                    Khung giờ mong muốn
                  </label>
                  {timeSlotOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {timeSlotOptions.map((t) => (
                        <label key={t.value} className="inline-flex items-center gap-2 rounded-xl border border-primary-200 px-4 py-2.5 cursor-pointer hover:bg-primary-50 transition-colors has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50">
                          <input type="checkbox" name="time" value={t.value} className="w-4 h-4 text-accent-600 focus:ring-accent-500 rounded" />
                          <span className="text-sm text-primary-700">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {scheduleClasses.length === 0 && timeSlotOptions.length > 0 && (
                    <p className="text-xs text-primary-500 mt-1.5">Khung giờ gợi ý. Trung tâm sẽ xếp lịch phù hợp.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-primary-900 mb-1.5">Ghi chú</label>
                  <textarea id="note" name="note" rows={3} className="w-full rounded-lg border border-primary-300 px-4 py-3 text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="Trình độ hiện tại, mục tiêu học..." />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto group" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                  <Send className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
