import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi, bodyHtmlForSave, bodyHtmlForDisplay, toImageUrl } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';

const LEVEL_OPTIONS = [
  { value: 'HSK1', label: 'HSK 1' },
  { value: 'HSK2', label: 'HSK 2' },
  { value: 'HSK3', label: 'HSK 3' },
  { value: 'HSK4', label: 'HSK 4' },
  { value: 'HSK5', label: 'HSK 5' },
  { value: 'HSK6', label: 'HSK 6' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Kids', label: 'Thiếu nhi' },
];

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
];

function formatPrice(price: number, currency: string): string {
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const isNew = id === 'new' || !id;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    nameZh: '',
    description: '',
    learningObjectives: '',
    level: 'HSK1',
    duration: 0,
    maxStudents: 20,
    price: 0,
    currency: 'VND',
    status: 'DRAFT',
    slug: '',
    thumbnail: '',
    allowGuest: false,
    visibleToRoles: [] as string[],
  });

  const ROLE_OPTIONS = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'TEACHER', label: 'Giảng viên' },
    { value: 'STUDENT', label: 'Học viên' },
  ];

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      coursesApi
        .get(id)
        .then((raw: unknown) => {
          const p = raw as Record<string, unknown>;
          setForm({
            code: String(p.code ?? ''),
            name: String(p.name ?? ''),
            nameZh: String(p.nameZh ?? ''),
            description: String(p.description ?? ''),
            learningObjectives: bodyHtmlForDisplay(String(p.learningObjectives ?? '')),
            level: String(p.level ?? 'HSK1'),
            duration: Number(p.duration) || 0,
            maxStudents: Number(p.maxStudents) || 20,
            price: Number(p.price) || 0,
            currency: String(p.currency ?? 'VND'),
            status: String(p.status ?? 'DRAFT'),
            slug: String(p.slug ?? ''),
            thumbnail: String(p.thumbnail ?? ''),
            allowGuest: Boolean(p.allowGuest),
            visibleToRoles: (Array.isArray(p.visibleToRoles) ? p.visibleToRoles : []).filter((r: string) => r !== 'ADMIN'),
          });
        })
        .catch(() => show('error', 'Không tải được khóa học.'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, show]);

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      show('error', 'Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }
    setUploadingThumbnail(true);
    try {
      const { path } = await coursesApi.uploadImage(file);
      setForm((f) => ({ ...f, thumbnail: path }));
      show('success', 'Đã tải ảnh bìa lên.');
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setUploadingThumbnail(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        learningObjectives: bodyHtmlForSave(form.learningObjectives) || undefined,
        duration: form.duration || 0,
        price: form.price || 0,
        maxStudents: form.maxStudents || 20,
        allowGuest: form.allowGuest,
        visibleToRoles: form.visibleToRoles,
      };
      if (isNew) {
        const c = (await coursesApi.create(payload)) as { id: string };
        show('success', 'Đã tạo khóa học.');
        navigate(`/courses/${c.id}`);
      } else {
        await coursesApi.update(id!, payload);
        show('success', 'Đã lưu khóa học.');
        navigate(`/courses/${id}`);
      }
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => navigate(isNew ? '/courses' : `/courses/${id}`)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} />
        {isNew ? 'Danh sách khóa học' : 'Quay lại khóa học'}
      </button>
      <h1 className="text-2xl font-bold mb-6">{isNew ? 'Thêm khóa học' : 'Chỉnh sửa khóa học'}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Thông tin cơ bản */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã khóa học *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="VD: HSK1-01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="hsk1-nen-tang"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tiếng Trung (tùy chọn)</label>
            <input
              value={form.nameZh}
              onChange={(e) => setForm((f) => ({ ...f, nameZh: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="基础汉语"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả khóa học</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
              rows={3}
              placeholder="Giới thiệu ngắn về khóa học, đối tượng phù hợp..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mục tiêu học tập</label>
            <RichTextEditor
              value={form.learningObjectives}
              onChange={(html) => setForm((f) => ({ ...f, learningObjectives: html }))}
              placeholder="Nhập mục tiêu học tập (có thể dùng danh sách, in đậm, link, ảnh...)"
              minHeight="120px"
            />
          </div>
        </section>

        {/* Cấp độ & Thời lượng */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cấp độ & Lớp học</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
              <select
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (số buổi)</label>
              <input
                type="number"
                min={0}
                value={form.duration || ''}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sĩ số tối đa</label>
              <input
                type="number"
                min={1}
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) || 20 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Giá & Xuất bản */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Giá & Xuất bản</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={form.currency === 'VND' ? 1000 : 0.01}
                  value={form.price || ''}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                >
                  {CURRENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {form.price > 0 && (
                <p className="text-sm text-gray-500 mt-1">{formatPrice(form.price, form.currency)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Xuất bản</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="allowGuest"
              checked={form.allowGuest}
              onChange={(e) => setForm((f) => ({ ...f, allowGuest: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="allowGuest" className="text-sm font-medium text-gray-700">
              Cho phép khách (chưa đăng nhập) xem khóa học
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò được xem</label>
            <p className="text-xs text-gray-500 mb-2">Chọn vai trò được phép xem khóa học. Để trống = tất cả vai trò.</p>
            <div className="flex flex-wrap gap-4">
              {ROLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.visibleToRoles.includes(opt.value)}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        visibleToRoles: e.target.checked
                          ? [...f.visibleToRoles, opt.value]
                          : f.visibleToRoles.filter((r) => r !== opt.value),
                      }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa khóa học</label>
            <input
              type="file"
              ref={thumbnailInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleThumbnailChange}
            />
            {form.thumbnail && (
              <div className="mb-3 relative inline-block">
                <img
                  src={toImageUrl(form.thumbnail)}
                  alt="Bìa khóa học"
                  className="max-h-40 rounded-lg border border-gray-200 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, thumbnail: '' }))}
                  className="absolute top-1 right-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <ImagePlus size={18} />
              {uploadingThumbnail ? 'Đang tải lên...' : form.thumbnail ? 'Đổi ảnh bìa' : 'Tải ảnh bìa lên'}
            </button>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
          >
            {saving ? 'Đang lưu...' : isNew ? 'Tạo khóa học' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isNew ? '/courses' : `/courses/${id}`)}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
