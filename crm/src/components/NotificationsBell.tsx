import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Send, UserPlus, Mail, ChevronRight } from 'lucide-react';
import { notificationsApi, type NotificationCounts } from '../api/client';

export default function NotificationsBell() {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCounts = () => {
    notificationsApi
      .getCounts()
      .then(setCounts)
      .catch(() => setCounts({ enrollmentRequestsPending: 0, trialPending: 0, leadsLast7Days: 0, total: 0 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCounts();
    const t = setInterval(fetchCounts, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const total = counts?.total ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={22} className="shrink-0" />
        {!loading && total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Thông báo</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 text-sm text-slate-500">Đang tải...</p>
            ) : (
              <>
                <Link
                  to="/courses"
                  className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Send size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">Yêu cầu đăng ký khóa học</p>
                    <p className="text-xs text-slate-500">
                      {counts?.enrollmentRequestsPending ?? 0} chờ duyệt (xem tại từng khóa học)
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </Link>
                <Link
                  to="/trial-registrations?status=PENDING"
                  className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <UserPlus size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">Đăng ký học thử</p>
                    <p className="text-xs text-slate-500">{counts?.trialPending ?? 0} chờ duyệt</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </Link>
                <Link
                  to="/leads"
                  className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Mail size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">Lead / Liên hệ</p>
                    <p className="text-xs text-slate-500">{counts?.leadsLast7Days ?? 0} mới (7 ngày qua)</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </Link>
                {total === 0 && (
                  <p className="px-3 py-4 text-sm text-slate-500">Không có thông báo mới.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
