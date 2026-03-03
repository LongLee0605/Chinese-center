import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi, avatarUrl, type UserAccount, type UserRole, type UserStatus } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEACHER', label: 'Giảng viên' },
  { value: 'STUDENT', label: 'Học viên' },
];

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Vô hiệu' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ xác minh' },
];

export default function AccountForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'STUDENT' as UserRole,
    status: 'PENDING_VERIFICATION' as UserStatus,
    title: '',
    bio: '',
    avatar: '' as string,
    specializations: [] as string[],
    yearsExperience: '' as string,
    teacherPublic: true,
    teacherOrderIndex: 0,
  });

  useEffect(() => {
    if (!id) return;
    usersApi
      .get(id)
      .then((u: UserAccount) => {
        setForm({
          email: u.email,
          password: '',
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone ?? '',
          role: u.role,
          status: u.status,
          title: (u as { title?: string }).title ?? '',
          bio: (u as { bio?: string }).bio ?? '',
          avatar: (u as { avatar?: string }).avatar ?? '',
          specializations: Array.isArray((u as { specializations?: string[] }).specializations)
            ? (u as { specializations: string[] }).specializations
            : [],
          yearsExperience: (u as { yearsExperience?: number }).yearsExperience != null
            ? String((u as { yearsExperience: number }).yearsExperience)
            : '',
          teacherPublic: (u as { teacherPublic?: boolean }).teacherPublic !== false,
          teacherOrderIndex: (u as { teacherOrderIndex?: number }).teacherOrderIndex ?? 0,
        });
      })
      .catch((e) => {
        show('error', e?.message || 'Không tải được thông tin');
        navigate('/accounts');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      show('error', 'Vui lòng điền họ tên và email.');
      return;
    }
    if (!id && !form.password.trim()) {
      show('error', 'Vui lòng nhập mật khẩu (tối thiểu 6 ký tự).');
      return;
    }
    if (!id && form.password.length < 6) {
      show('error', 'Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    setSaving(true);
    try {
      const basePayload = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        status: form.status,
      };
      if (id) {
        const payload: Parameters<typeof usersApi.update>[1] = { ...basePayload };
        if (form.password.trim()) payload.password = form.password;
        if (form.role === 'TEACHER') {
          payload.title = form.title.trim() || undefined;
          payload.bio = form.bio.trim() || undefined;
          payload.specializations = form.specializations;
          payload.yearsExperience = form.yearsExperience ? parseInt(form.yearsExperience, 10) : undefined;
          payload.teacherPublic = form.teacherPublic;
          payload.teacherOrderIndex = form.teacherOrderIndex;
        }
        await usersApi.update(id, payload);
        show('success', 'Đã cập nhật tài khoản.');
      } else {
        const payload: Parameters<typeof usersApi.create>[0] = {
          ...basePayload,
          password: form.password,
        };
        if (form.role === 'TEACHER') {
          payload.title = form.title.trim() || undefined;
          payload.bio = form.bio.trim() || undefined;
          payload.specializations = form.specializations.length ? form.specializations : undefined;
          payload.yearsExperience = form.yearsExperience ? parseInt(form.yearsExperience, 10) : undefined;
          payload.teacherPublic = form.teacherPublic;
          payload.teacherOrderIndex = form.teacherOrderIndex;
        }
        await usersApi.create(payload);
        show('success', 'Đã tạo tài khoản.');
        navigate('/accounts');
      }
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !id) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      show('error', 'Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }
    setUploadingAvatar(true);
    try {
      const { avatarPath } = await usersApi.uploadAvatar(id, file);
      setForm((f) => ({ ...f, avatar: avatarPath }));
      show('success', 'Đã tải ảnh lên.');
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Tải ảnh thất bại.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const isTeacher = form.role === 'TEACHER';

  if (loading) return <div className="crm-page flex items-center justify-center min-h-[200px]"><span className="text-slate-500">Đang tải...</span></div>;

  return (
    <div className="crm-page">
      <div className="mb-4">
        <Link to="/accounts" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">{id ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}</h1>
      <form onSubmit={handleSubmit} className="crm-card max-w-xl space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="crm-input w-full"
            required
            readOnly={!!id}
          />
          {id && <p className="text-xs text-slate-500 mt-0.5">Không thể đổi email.</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mật khẩu {id ? '(để trống nếu không đổi)' : '*'}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="crm-input w-full"
            minLength={id ? 0 : 6}
            placeholder={id ? '••••••••' : ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="crm-input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="crm-input w-full"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="crm-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            className="crm-input w-full"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
            className="crm-input w-full"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {isTeacher && (
          <>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Thông tin hiển thị đội ngũ (website)</h2>
              <div className="space-y-4">
                {id && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện</label>
                    <input type="file" ref={avatarInputRef} accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} />
                    <div className="flex items-center gap-3">
                      {form.avatar && (
                        <img src={avatarUrl(form.avatar)} alt="Avatar" className="w-20 h-20 rounded-lg object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        <ImagePlus size={16} />
                        {uploadingAvatar ? 'Đang tải...' : form.avatar ? 'Đổi ảnh' : 'Tải ảnh lên'}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức danh</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="crm-input w-full"
                    placeholder="VD: Giáo viên trưởng, GV bản ngữ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu (bio)</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    className="crm-input w-full min-h-[80px]"
                    placeholder="Mô tả ngắn về giáo viên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chuyên môn (mỗi mục một dòng hoặc cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    value={form.specializations.join(', ')}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      specializations: e.target.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean),
                    }))}
                    className="crm-input w-full"
                    placeholder="HSK, Giao tiếp, Thiếu nhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số năm kinh nghiệm</label>
                  <input
                    type="number"
                    min={0}
                    value={form.yearsExperience}
                    onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
                    className="crm-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự hiển thị (số nhỏ lên trước)</label>
                  <input
                    type="number"
                    value={form.teacherOrderIndex}
                    onChange={(e) => setForm((f) => ({ ...f, teacherOrderIndex: parseInt(e.target.value, 10) || 0 }))}
                    className="crm-input w-full"
                  />
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.teacherPublic}
                    onChange={(e) => setForm((f) => ({ ...f, teacherPublic: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Hiển thị trên trang Đội ngũ giáo viên (website)</span>
                </label>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-5 pt-2 items-center">
          <button type="submit" disabled={saving} className="crm-btn-primary">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <Link to="/accounts" className="crm-btn-ghost">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
