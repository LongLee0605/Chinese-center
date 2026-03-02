import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Kiểm tra chuỗi có giống HTML (chứa thẻ) hay chỉ là plain text. */
export function bodyLooksLikeHtml(body: string | null | undefined): boolean {
  if (!body || typeof body !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(body.trim());
}

/**
 * Chuyển plain text (có xuống dòng) sang HTML để hiển thị đúng.
 * Dùng cho bài viết cũ chưa dùng rich text editor.
 */
export function plainTextToHtml(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}
