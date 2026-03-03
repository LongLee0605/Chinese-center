/**
 * Chuẩn hóa URL video bài giảng:
 * - YouTube (watch, youtu.be) → embed URL
 * - Vimeo → embed URL
 * - Link trực tiếp (.mp4, .webm, .ogg) → dùng thẻ <video>
 */

const YOUTUBE_WATCH = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;
const DIRECT_VIDEO = /\.(mp4|webm|ogg|mov)(\?|$)/i;

export type VideoDisplay = 
  | { type: 'embed'; url: string }
  | { type: 'video'; url: string };

export function normalizeLessonVideoUrl(rawUrl: string | null | undefined): VideoDisplay | null {
  const url = rawUrl?.trim();
  if (!url) return null;

  const yt = url.match(YOUTUBE_WATCH);
  if (yt) {
    return { type: 'embed', url: `https://www.youtube.com/embed/${yt[1]}` };
  }

  const vimeo = url.match(VIMEO);
  if (vimeo) {
    return { type: 'embed', url: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  if (DIRECT_VIDEO.test(url)) {
    return { type: 'video', url };
  }

  return { type: 'embed', url };
}
