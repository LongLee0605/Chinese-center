import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { leadsApi, type Lead } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Mail, Phone, User, FileText, Calendar, Send, Trash2 } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  TU_VAN: 'Tư vấn (Liên hệ)',
  DANG_KY_HOC_THU: 'Đăng ký học thử',
};

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
    navigate('/mail', {
      state: {
        composeTo: lead!.email,
        composeSubject: `Phản hồi: ${lead!.name} - Chinese Center`,
      },
    });
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!lead) return <div className="p-6">Không tìm thấy đăng ký.</div>;

  return (
    <div className="p-6 max-w-2xl">
      <Link
        to="/leads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={18} />
        Về danh sách email đăng ký
      </Link>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Chi tiết đăng ký</h1>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              lead.type === 'DANG_KY_HOC_THU' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {TYPE_LABELS[lead.type] ?? lead.type}
          </span>
        </div>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={goToCompose}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            <Send size={18} />
            Gửi email
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50"
          >
            <Trash2 size={18} />
            Xóa đăng ký
          </button>
        </div>
        <dl className="space-y-4">
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Thời gian gửi</dt>
              <dd className="text-gray-900">{new Date(lead.createdAt).toLocaleString('vi-VN')}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <User className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Họ tên</dt>
              <dd className="text-gray-900">{lead.name}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
              <dd>
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                  {lead.email}
                </a>
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Điện thoại</dt>
              <dd>
                <a href={`tel:${lead.phone}`} className="text-gray-900">{lead.phone}</a>
              </dd>
            </div>
          </div>
          {lead.message && (
            <div className="flex gap-3">
            <FileText className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Nội dung (tin nhắn)</dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{lead.message}</dd>
            </div>
          </div>
          )}
          {lead.courseInterest && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Khóa học quan tâm</dt>
              <dd className="text-gray-900">{lead.courseInterest}</dd>
            </div>
          )}
          {lead.timePreference && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Khung giờ mong muốn</dt>
              <dd className="text-gray-900">{lead.timePreference}</dd>
            </div>
          )}
          {lead.note && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Ghi chú</dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{lead.note}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
