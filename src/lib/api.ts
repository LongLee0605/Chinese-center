// Local: .env.development hoặc fallback localhost
// Production: .env.production hoặc fallback Render
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:4000/api/v1'
    : 'https://chinese-center.onrender.com/api/v1');

/** Base URL của API (dùng chung cho fetch / RTK Query). */
export function getApiBase(): string {
  return API_BASE;
}

/** Gốc URL để build đường dẫn upload (avatar, cover, thumbnail). Luôn trùng với API để tránh lỗi ảnh local/production. */
export function getUploadsBase(): string {
  return API_BASE.replace(/\/api\/v1\/?$/, '');
}

/** Build URL ảnh từ path lưu trong DB. Không lưu full URL trong DB — chỉ path (vd: posts/xxx.jpg). */
export function toImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${getUploadsBase()}/uploads/${path}`;
}

const UPLOADS_PLACEHOLDER = '__UPLOADS__/';

/** Chuẩn hóa body HTML khi hiển thị: thay placeholder và URL upload cũ bằng base hiện tại (tránh lỗi ảnh localhost trên production). */
export function bodyHtmlForDisplay(html: string): string {
  if (!html) return html;
  const base = `${getUploadsBase()}/uploads/`;
  let out = html.replace(new RegExp(UPLOADS_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), base);
  out = out.replace(/src="(https?:\/\/[^"]+)\/uploads\/([^"]+)"/gi, (_m, _host, path) => `src="${base}${path}"`);
  return out;
}

/** Key localStorage cho token (tách với CRM). */
export const AUTH_STORAGE_KEY = 'website_token';
/** Key localStorage cho user (JSON). */
export const AUTH_USER_KEY = 'website_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<AuthUser>('/auth/me'),
};

export type LeadType = 'TU_VAN' | 'DANG_KY_HOC_THU';

export const leadApi = {
  submit: (body: {
    type: LeadType;
    name: string;
    email: string;
    phone: string;
    message?: string;
    courseInterest?: string;
    timePreference?: string;
    note?: string;
  }) => api<{ id: string }>('/leads', { method: 'POST', body: JSON.stringify(body) }),
};

export const coursesApi = {
  list: () => api<{ items: { id: string; name: string; slug: string; level?: string }[] }>('/courses?limit=50'),
};

export const postsApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    return api<{ items: { id: string; title: string; slug: string }[] }>(`/posts?${q}`);
  },
};

export type QuizQuestion = {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'SHORT_ANSWER';
  questionText: string;
  options: string[] | null;
  orderIndex: number;
};

export type QuizPublic = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  quizType: 'MULTIPLE_CHOICE_ONLY' | 'ESSAY_ONLY' | 'MIXED';
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  questions: QuizQuestion[];
};

export type QuizSubmitResult = {
  score: number | null;
  mcCorrect: number;
  mcTotal: number;
  totalQuestions: number;
  hasEssayPending: boolean;
  passed: boolean;
  attemptNumber?: number;
};

export type QuizMyAttemptsSummary = {
  attemptsCount: number;
  latestScore: number | null;
  latestSubmittedAt: string | null;
};

export type QuizListItem = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  quizType: string;
  timeLimitMinutes?: number | null;
  passingScore?: number | null;
  _count: { questions: number };
};

export const quizzesApi = {
  listPublished: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: QuizListItem[]; total: number; page: number; limit: number }>(
      `/quizzes/published?${q}`,
    );
  },
  getBySlug: (slug: string) => api<QuizPublic>(`/quizzes/by-slug/${slug}`),
  getMyAttempts: (quizId: string) =>
    api<QuizMyAttemptsSummary>(`/quizzes/${quizId}/my-attempts`),
  submitAttempt: (
    quizId: string,
    body: { answers: Record<string, string>; guestName?: string; guestEmail?: string },
  ) =>
    api<QuizSubmitResult>(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
