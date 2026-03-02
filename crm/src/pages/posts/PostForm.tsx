import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsApi, getUploadsBase, bodyHtmlForSave, bodyHtmlForDisplay } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import RichTextEditor from '../../components/RichTextEditor';
import { ImagePlus } from 'lucide-react';

function coverImageUrl(coverImage: string): string {
  if (!coverImage) return '';
  if (coverImage.startsWith('http')) return coverImage;
  return `${getUploadsBase()}/uploads/${coverImage}`;
}

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const isNew = id === 'new' || !id;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    coverImage: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    if (!isNew && id) {
      postsApi
        .get(id)
        .then((p: any) =>
          setForm({
            title: p.title ?? '',
            slug: p.slug ?? '',
            excerpt: p.excerpt ?? '',
            body: bodyHtmlForDisplay(p.body ?? ''),
            coverImage: p.coverImage ?? '',
            status: p.status ?? 'DRAFT',
          })
        )
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      show('error', 'Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }
    setUploadingCover(true);
    try {
      const { path } = await postsApi.uploadImage(file);
      setForm((f) => ({ ...f, coverImage: path }));
      show('success', 'Đã tải ảnh bìa lên.');
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setUploadingCover(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      body: bodyHtmlForSave(form.body),
      publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
    };
    (isNew ? postsApi.create(payload) : postsApi.update(id!, payload))
      .then(() => {
        show('success', isNew ? 'Đã tạo bài viết.' : 'Đã lưu bài viết.');
        navigate('/posts');
      })
      .catch((e: any) => show('error', e?.message || 'Lưu thất bại.'))
      .finally(() => setSaving(false));
  }

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{isNew ? 'Thêm bài viết' : 'Sửa bài viết'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nội dung bài viết</label>
          <p className="text-xs text-gray-500 mb-1">
            Dùng công cụ trên để định dạng: tiêu đề, in đậm, danh sách, link. Nội dung hiển thị trên website giống y như tại đây.
          </p>
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            placeholder="Nhập nội dung bài viết..."
            minHeight="320px"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleCoverChange}
          />
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {form.coverImage && (
              <div className="shrink-0 w-40 h-28 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={coverImageUrl(form.coverImage)}
                  alt="Bìa"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
              >
                <ImagePlus className="h-4 w-4" />
                {uploadingCover ? 'Đang tải lên...' : form.coverImage ? 'Đổi ảnh bìa' : 'Tải ảnh bìa lên'}
              </button>
              {form.coverImage && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Xóa ảnh bìa
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
