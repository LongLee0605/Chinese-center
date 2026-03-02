import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { leadsApi, type Lead } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Mail, Phone, User, FileText, Calendar, Send, Trash2, BookOpen, Clock, MessageSquare } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  TU_VAN: 'Tư vấn (Liên hệ)',
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

function InfoRow({
  icon: Icon,
  label,
  children,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-4 py-3 px-4${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
        <dd className="mt-1 text-gray-900 break-words">{children}</dd>
      </div>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    leadsApi
      .get(id)
      .then(setLead)
      .catch(() => setLead(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!lead || !confirm(`Xóa đăng ký của ${lead.name}?`)) return;
    try {
      await leadsApi.delete(lead.id);
      show('success', 'Đã xóa đăng ký.');
      navigate('/leads');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  };

  const goToCompose = () => {
    if (!lead) return;
    navigate('/mail', {
      state: {
        composeTo: lead.email,
        composeSubject: `Phản hồi: ${lead.name} - Chinese Center`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-gray-600">Không tìm thấy đăng ký.</p>
        <Link
          to="/leads"
          className="mt-4 inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
        >
          <ArrowLeft size={18} />
          Về danh sách email đăng ký
        </Link>
      </div>
    );
  }

  const isTrial = lead.type === 'DANG_KY_HOC_THU';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        to="/leads"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={18} />
        Về danh sách email đăng ký
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${
                isTrial ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {getInitials(lead.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{lead.name}</h1>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isTrial ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                }`}
              >
                {TYPE_LABELS[lead.type] ?? lead.type}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goToCompose}
              className="crm-btn-primary text-sm"
            >
              <Send size={18} />
              Gửi email
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              Xóa đăng ký
            </button>
          </div>
        </div>

        <dl className="divide-y divide-gray-100">
          <InfoRow icon={Calendar} label="Thời gian gửi">
            {new Date(lead.createdAt).toLocaleString('vi-VN')}
          </InfoRow>
          <InfoRow icon={User} label="Họ tên">
            {lead.name}
          </InfoRow>
          <InfoRow icon={Mail} label="Email">
            <a href={`mailto:${lead.email}`} className="text-sky-600 hover:text-sky-700 hover:underline break-all">
              {lead.email}
            </a>
          </InfoRow>
          <InfoRow icon={Phone} label="Điện thoại">
            <a href={`tel:${lead.phone}`} className="text-gray-900 hover:text-gray-700">
              {lead.phone}
            </a>
          </InfoRow>
          {lead.message && (
            <InfoRow icon={MessageSquare} label="Nội dung (tin nhắn)">
              <span className="whitespace-pre-wrap block">{lead.message}</span>
            </InfoRow>
          )}
          {lead.courseInterest && (
            <InfoRow icon={BookOpen} label="Khóa học quan tâm">
              {lead.courseInterest}
            </InfoRow>
          )}
          {lead.timePreference && (
            <InfoRow icon={Clock} label="Khung giờ mong muốn">
              {lead.timePreference}
            </InfoRow>
          )}
          {lead.note && (
            <InfoRow icon={FileText} label="Ghi chú">
              <span className="whitespace-pre-wrap block">{lead.note}</span>
            </InfoRow>
          )}
        </dl>
      </div>
    </div>
  );
}
