import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leadsApi, type Lead } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Trash2, Mail, Phone, BookOpen, Clock, Send, Inbox } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  TU_VAN: 'Tư vấn',
  DANG_KY_HOC_THU: 'Đăng ký học thử',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function LeadCard({
  lead,
  onDelete,
  onSendEmail,
}: {
  lead: Lead;
  onDelete: (lead: Lead, e: React.MouseEvent) => void;
  onSendEmail: (lead: Lead) => void;
}) {
  const isTrial = lead.type === 'DANG_KY_HOC_THU';
  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
              isTrial ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
            }`}
          >
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">{lead.name}</h3>
                <span
                  className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isTrial ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {TYPE_LABELS[lead.type] ?? lead.type}
                </span>
              </div>
              <p className="text-xs text-gray-400 shrink-0">
                {new Date(lead.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium"
              >
                <Mail size={16} className="shrink-0" />
                <span className="break-all">{lead.email}</span>
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
              >
                <Phone size={16} className="shrink-0" />
                {lead.phone}
              </a>
            </div>
            {(lead.message || lead.courseInterest || lead.timePreference || lead.note) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                {lead.message && (
                  <p className="line-clamp-2 whitespace-pre-wrap break-words">{lead.message}</p>
                )}
                {(lead.courseInterest || lead.timePreference) && (
                  <div className="flex flex-wrap gap-2">
                    {lead.courseInterest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        <BookOpen size={14} />
                        {lead.courseInterest}
                      </span>
                    )}
                    {lead.timePreference && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        <Clock size={14} />
                        {lead.timePreference}
                      </span>
                    )}
                  </div>
                )}
                {lead.note && (
                  <p className="line-clamp-1 text-gray-500 italic">{lead.note}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
          <Link
            to={`/leads/${lead.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Xem chi tiết
          </Link>
          <button
            type="button"
            onClick={() => onSendEmail(lead)}
            className="crm-btn-primary text-sm"
          >
            <Send size={16} />
            Gửi email
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(lead, e)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
            title="Xóa"
          >
            <Trash2 size={16} />
            Xóa
          </button>
        </div>
      </div>
    </article>
  );
}

export default function LeadsList() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [data, setData] = useState<{ items: Lead[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    leadsApi
      .list({ page, limit: 15, type: typeFilter || undefined })
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }));
  }, [page, typeFilter]);

  const handleDelete = async (lead: Lead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Xóa đăng ký của ${lead.name}?`)) return;
    try {
      await leadsApi.delete(lead.id);
      setData((d) => (d ? { ...d, items: d.items.filter((l) => l.id !== lead.id), total: d.total - 1 } : null));
      show('success', 'Đã xóa đăng ký.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  };

  const handleSendEmail = (lead: Lead) => {
    navigate('/mail', {
      state: {
        composeTo: lead.email,
        composeSubject: `Phản hồi: ${lead.name} - Chinese Center`,
      },
    });
  };

  if (!data) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Email đăng ký
        </h1>
        <p className="mt-2 text-gray-500 text-sm max-w-xl">
          Form Liên hệ và Đăng ký học thử từ website. Xem đầy đủ thông tin và phản hồi nhanh bằng email.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'TU_VAN', label: 'Tư vấn' },
            { value: 'DANG_KY_HOC_THU', label: 'Đăng ký học thử' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === opt.value
                  ? 'bg-crm-accent text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500 font-medium">Chưa có đăng ký nào</p>
          <p className="mt-1 text-sm text-gray-400">
            Các đăng ký từ form website sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <ul className="space-y-5">
          {data.items.map((lead) => (
            <li key={lead.id}>
              <LeadCard
                lead={lead}
                onDelete={handleDelete}
                onSendEmail={handleSendEmail}
              />
            </li>
          ))}
        </ul>
      )}

      {data.total > 15 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="min-w-[2.5rem] py-2 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Trước
          </button>
          <span className="py-2 px-4 text-sm text-gray-500">
            {page} / {Math.ceil(data.total / 15)}
          </span>
          <button
            disabled={page >= Math.ceil(data.total / 15)}
            onClick={() => setPage((p) => p + 1)}
            className="min-w-[2.5rem] py-2 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Sau
          </button>
        </nav>
      )}
    </div>
  );
}
