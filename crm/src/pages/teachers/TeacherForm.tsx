import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teachersApi, type Teacher } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Upload, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/?$/, '');

function avatarUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${UPLOADS_BASE}/uploads/${avatarPath}`;
}

export default function TeacherForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    title: '',
    bio: '',
    specializationsStr: '',
    yearsExperience: '' as string | number,
    isPublic: true,
    orderIndex: 0,
  });

  useEffect(() => {
    if (!id) return;
    teachersApi
      .get(id)
      .then((t) => {
        setForm({
          name: t.name,
          title: t.title ?? '',
          bio: t.bio ?? '',
          specializationsStr: Array.isArray(t.specializations) ? t.specializations.join(', ') : '',
          yearsExperience: t.yearsExperience ?? '',
          isPublic: t.isPublic ?? true,
          orderIndex: t.orderIndex ?? 0,
        });
      })
      .catch((e) => {
        show('error', e?.message || 'Không tải được thông tin');
        navigate('/teachers');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const specializations = form.specializationsStr
        ? form.specializationsStr.split(',').map((s) => (s.trim())).filter((x) => x.length > 0)
        : [];
      const yearsExperience =
        form.yearsExperience === '' ? undefined : +form.yearsExperience;
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || undefined,
        bio: form.bio.trim() || undefined,
        specializations,
        yearsExperience,
        isPublic: form.isPublic,
        orderIndex: form.orderIndex,
      };
      if (id) {
        await teachersApi.update(id, payload);
        show('success', 'Đã cập nhật giáo viên.');
      } else {
        const t = await teachersApi.create(payload);
        if (pendingAvatarFile) {
          try {
            await teachersApi.uploadAvatar(t.id, pendingAvatarFile);
            show('success', 'Đã thêm giáo viên và ảnh đại diện.');
          } catch {
            show('success', 'Đã thêm giáo viên. Ảnh đại diện có thể tải lên sau.');
          }
        } else {
          show('success', 'Đã thêm giáo viên.');
        }
        setPendingAvatarFile(null);
        navigate(`/teachers/${t.id}`);
      }
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (id) {
      setUploading(true);
      try {
        await teachersApi.uploadAvatar(id, file);
        show('success', 'Đã cập nhật ảnh.');
        setForm((f) => ({ ...f }));
        window.dispatchEvent(new CustomEvent('teacher-avatar-updated', { detail: {} }));
      } catch (err: unknown) {
        show('error', err instanceof Error ? err.message : 'Upload ảnh thất bại.');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    } else {
      setPendingAvatarFile(file);
      e.target.value = '';
    }
  };

  const clearPendingAvatar = () => {
    setPendingAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!id || !form.name) return;
    if (!confirm(`Xóa giáo viên "${form.name}"? Hành động không thể hoàn tác.`)) return;
    try {
      await teachersApi.delete(id);
      show('success', 'Đã xóa giáo viên.');
      navigate('/teachers');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  };

  const previewUrl = useMemo(
    () => (!id && pendingAvatarFile ? URL.createObjectURL(pendingAvatarFile) : null),
    [id, pendingAvatarFile]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (id && loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">{id ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
        {/* Ảnh đại diện: luôn hiện, tạo mới chọn file (upload sau khi lưu), chỉnh sửa đổi ảnh ngay */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {id ? (
              <TeacherAvatar id={id} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm text-center px-1">Chưa chọn ảnh</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 w-fit"
            >
              <Upload size={16} />
              {id ? (uploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện') : (pendingAvatarFile ? 'Chọn ảnh khác' : 'Chọn ảnh đại diện')}
            </button>
            {!id && pendingAvatarFile && (
              <button
                type="button"
                onClick={clearPendingAvatar}
                className="text-sm text-gray-500 hover:text-red-600 w-fit"
              >
                Bỏ ảnh đã chọn
              </button>
            )}
            {!id && (
              <p className="text-xs text-gray-500">Ảnh sẽ được tải lên khi bạn nhấn &quot;Thêm giáo viên&quot;.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Họ tên *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chức danh</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="VD: Giáo viên trưởng, GV bản ngữ"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Giới thiệu (bio)</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chuyên môn (cách nhau bằng dấu phẩy)</label>
          <input
            value={form.specializationsStr}
            onChange={(e) => setForm((f) => ({ ...f, specializationsStr: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="VD: HSK, Giao tiếp, Thiếu nhi"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Số năm kinh nghiệm</label>
            <input
              type="number"
              min={0}
              value={form.yearsExperience}
              onChange={(e) =>
                setForm((f) => ({ ...f, yearsExperience: e.target.value === '' ? '' : e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              min={0}
              value={form.orderIndex}
              onChange={(e) => setForm((f) => ({ ...f, orderIndex: Number(e.target.value) || 0 }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={form.isPublic}
            onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isPublic">Hiển thị trên website</label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : id ? 'Cập nhật' : 'Thêm giáo viên'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/teachers')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50"
            >
              <Trash2 size={16} />
              Xóa giáo viên
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function TeacherAvatar({ id }: { id: string }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  useEffect(() => {
    teachersApi.get(id).then(setTeacher);
  }, [id]);
  useEffect(() => {
    const onUpdate = () => teachersApi.get(id).then(setTeacher);
    window.addEventListener('teacher-avatar-updated', onUpdate);
    return () => window.removeEventListener('teacher-avatar-updated', onUpdate);
  }, [id]);
  const url = avatarUrl(teacher?.avatarPath);
  if (!url) return <span className="text-gray-400 text-sm">Chưa có ảnh</span>;
  return <img src={url} alt="" className="w-full h-full object-cover" />;
}
