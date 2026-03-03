/**
 * Chỉ lưu path tương đối (vd: posts/xxx.jpg, courses/yyy.png) vào DB
 * để ảnh luôn load theo API base hiện tại (local vs production).
 * Nếu client gửi full URL (do paste hoặc cũ), tách lấy path sau /uploads/
 */
export function normalizeImagePath(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/uploads\/(.+)$/i);
  if (match) return match[1].replace(/^\/+/, '');
  if (/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}
