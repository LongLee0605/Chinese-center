import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mailApi, type SentEmail } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, RefreshCw, Edit3, Trash2 } from 'lucide-react';

type View = 'compose' | 'list' | 'detail';

type LocationState = { composeTo?: string; composeSubject?: string } | null;

export default function Mail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [view, setView] = useState<View>('compose');
  const [configOk, setConfigOk] = useState<boolean | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const [sentList, setSentList] = useState<{ items: SentEmail[]; total: number } | null>(null);
  const [sentPage, setSentPage] = useState(1);
  const [sentDetail, setSentDetail] = useState<SentEmail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.composeTo) {
      setTo(state.composeTo);
      if (state.composeSubject) setSubject(state.composeSubject);
      setView('compose');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const checkConfig = async () => {
    try {
      const res = await mailApi.check();
      setConfigOk(res.configured);
      show(res.configured ? 'success' : 'info', res.configured ? 'SMTP đã cấu hình.' : 'Chưa cấu hình SMTP. Khi gửi sẽ báo lỗi.');
    } catch {
      setConfigOk(false);
      show('error', 'Không kết nối được backend.');
    }
  };

  useEffect(() => {
    if (view === 'list') {
      mailApi
        .listSent({ page: sentPage, limit: 20 })
        .then(setSentList)
        .catch(() => setSentList({ items: [], total: 0 }));
    }
  }, [view, sentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = to.split(/[\s,;]+/).map((s) => (s.trim())).filter((x) => x.length > 0);
    if (!emails.length) {
      show('error', 'Nhập ít nhất một địa chỉ email.');
      return;
    }
    if (!subject.trim()) {
      show('error', 'Nhập tiêu đề.');
      return;
    }
    setSending(true);
    try {
      const res = await mailApi.send({
        to: emails,
        subject: subject.trim(),
        text: body.trim() || undefined,
        html: body.trim() ? '<p>' + body.trim().replace(/\n/g, '<br>') + '</p>' : undefined,
      });
      if (res.success) {
        show('success', 'Đã gửi email.');
        setTo('');
        setSubject('');
        setBody('');
        setView('list');
        setSentList((prev) => prev ? { ...prev, total: prev.total + 1 } : null);
      } else {
        show('error', res.error || 'Gửi thất bại.');
      }
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Gửi thất bại.');
    } finally {
      setSending(false);
    }
  };

  const openDetail = (id: string) => {
    setLoadingDetail(true);
    mailApi
      .getSent(id)
      .then((email) => {
        setSentDetail(email);
        setView('detail');
      })
      .catch(() => show('error', 'Không tải được nội dung email.'))
      .finally(() => setLoadingDetail(false));
  };

  const resend = async (email: SentEmail) => {
    const emails = email.toAddresses.split(/[\s,;]+/).map((s) => (s.trim())).filter(Boolean);
    if (!emails.length) {
      show('error', 'Email không có địa chỉ nhận.');
      return;
    }
    setSending(true);
    try {
      const res = await mailApi.send({
        to: emails,
        subject: email.subject,
        text: email.text || undefined,
        html: email.html || undefined,
      });
      if (res.success) {
        show('success', 'Đã gửi lại email.');
        setView('list');
      } else {
        show('error', res.error || 'Gửi lại thất bại.');
      }
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Gửi lại thất bại.');
    } finally {
      setSending(false);
    }
  };

  const editAndResend = (email: SentEmail) => {
    setTo(email.toAddresses);
    setSubject(email.subject);
    setBody(email.text || email.html?.replace(/<[^>]+>/g, '\n') || '');
    setSentDetail(null);
    setView('compose');
  };

  const handleDeleteSent = async (email: SentEmail, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Xóa email đã gửi này khỏi danh sách?')) return;
    try {
      await mailApi.deleteSent(email.id);
      show('success', 'Đã xóa.');
      if (view === 'detail' && sentDetail?.id === email.id) {
        setSentDetail(null);
        setView('list');
      }
      setSentList((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((x) => x.id !== email.id), total: Math.max(0, prev.total - 1) }
          : null
      );
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  };

  return (
    <div className="crm-page max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Gửi email</h1>
      <p className="text-slate-600 text-sm mb-2">
        Gửi email từ CRM. Nếu chưa cấu hình SMTP trong backend (local: .env; Render: Environment), khi gửi sẽ báo lỗi.
      </p>
      <button
        type="button"
        onClick={checkConfig}
        className="mb-4 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
      >
        Kiểm tra SMTP
      </button>

      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => { setView('compose'); setSentDetail(null); }}
          className={`px-4 py-2 rounded-t ${view === 'compose' ? 'bg-crm-accent text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
        >
          Soạn email
        </button>
        <button
          type="button"
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-t ${view === 'list' || view === 'detail' ? 'bg-crm-accent text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
        >
          Email đã gửi
        </button>
      </div>

      {view === 'compose' && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Người nhận (nhiều email cách nhau bằng dấu phẩy)</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nội dung</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={6}
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="crm-btn-primary disabled:opacity-50"
          >
            <Send size={18} />
            {sending ? 'Đang gửi...' : 'Gửi email'}
          </button>
        </form>
      )}

      {view === 'list' && (
        <div>
          <p className="text-gray-500 text-sm mb-2">
            Chỉ liệt kê email đã gửi từ CRM (không bao gồm thông báo tự động khi có đăng ký từ website).
          </p>
          <div className="bg-white rounded-lg shadow overflow-hidden">
          {!sentList ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : sentList.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có email nào được gửi.</div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Thời gian</th>
                    <th className="text-left p-3 text-sm font-medium">Người nhận</th>
                    <th className="text-left p-3 text-sm font-medium">Tiêu đề</th>
                    <th className="w-28 p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sentList.items.map((email) => (
                    <tr
                      key={email.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetail(email.id)}
                    >
                      <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(email.sentAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-sm max-w-xs truncate">{email.toAddresses}</td>
                      <td className="p-3 font-medium max-w-md truncate">{email.subject}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openDetail(email.id)}
                          className="text-blue-600 hover:underline text-sm mr-2"
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={(ev) => handleDeleteSent(email, ev)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sentList.total > 20 && (
                <div className="p-2 flex justify-center gap-2 border-t">
                  <button
                    disabled={sentPage <= 1}
                    onClick={() => setSentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="py-1">{sentPage} / {Math.ceil(sentList.total / 20)}</span>
                  <button
                    disabled={sentPage >= Math.ceil(sentList.total / 20)}
                    onClick={() => setSentPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      )}

      {view === 'detail' && sentDetail && (
        <div className="bg-white rounded-lg shadow p-6">
          {loadingDetail ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setView('list'); setSentDetail(null); }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft size={18} />
                Về danh sách
              </button>
              <dl className="space-y-3 mb-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Người nhận</dt>
                  <dd className="text-gray-900">{sentDetail.toAddresses}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Tiêu đề</dt>
                  <dd className="text-gray-900 font-medium">{sentDetail.subject}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Thời gian gửi</dt>
                  <dd className="text-gray-600">{new Date(sentDetail.sentAt).toLocaleString('vi-VN')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Nội dung</dt>
                  <dd className="mt-1 p-3 bg-gray-50 rounded">
                    {sentDetail.html ? (
                      <div className="text-gray-900 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sentDetail.html }} />
                    ) : (
                      <pre className="text-gray-900 whitespace-pre-wrap font-sans text-sm">{sentDetail.text || '—'}</pre>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => resend(sentDetail)}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  <RefreshCw size={18} />
                  Gửi lại
                </button>
                <button
                  type="button"
                  onClick={() => editAndResend(sentDetail)}
                  className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  <Edit3 size={18} />
                  Chỉnh sửa và gửi lại
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSent(sentDetail)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50"
                >
                  <Trash2 size={18} />
                  Xóa
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
