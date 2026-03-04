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

/** Chuẩn hóa message lỗi từ response (Nest trả về message: string | string[]). */
function getErrorMessage(data: { message?: string | string[] }, fallback: string): string {
  const m = data?.message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m) && m.length) return m[0];
  return fallback;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (networkErr) {
    const msg =
      networkErr instanceof TypeError && networkErr.message === 'Failed to fetch'
        ? 'Không kết nối được máy chủ. Kiểm tra mạng hoặc URL API (VITE_API_URL).'
        : (networkErr as Error).message;
    throw new Error(msg);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = getErrorMessage(err, res.statusText || 'Request failed');
    throw new Error(message);
  }
  return res.json();
}

/** Đồng bộ với backend GET /auth/me (full profile). Login vẫn trả về id, email, firstName, lastName, role. */
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  status?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string | null;
  title?: string | null;
  bio?: string | null;
  specializations?: string[];
  yearsExperience?: number | null;
  isTrial?: boolean;
  trialExpiresAt?: string | null;
  enrollments?: { courseId: string; courseName: string; courseSlug: string; enrolledAt: string; totalLessons: number; completedLessons: number; percentProgress: number }[];
  quizAttempts?: { id: string; quizId: string; quizTitle: string; quizSlug: string; score: number | null; submittedAt: string | null }[];
  classesCurrent?: { id: string; name: string; status: string }[];
  classesPast?: { id: string; name: string; status: string; closedAt?: string }[];
  classesTeachingCurrent?: { id: string; name: string; status: string }[];
  classesTeachingPast?: { id: string; name: string; status: string; closedAt?: string }[];
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

/** Lớp học công khai (lịch): cho trang Lịch học, đăng ký lớp. */
export type ScheduleClassItem = {
  id: string;
  name: string;
  scheduleDayOfWeek: number[];
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  room: string | null;
  maxMembers: number | null;
  teacher: { id: string; firstName: string; lastName: string };
  _count?: { members: number };
  /** Sĩ số (backend trả về rõ ràng). */
  memberCount?: number;
};

export const scheduleApi = {
  getClasses: () =>
    api<{ items: ScheduleClassItem[] }>('/schedule'),
  joinClass: (classId: string) =>
    api<{ success: boolean; message: string }>(`/schedule/${classId}/join`, {
      method: 'POST',
    }),
  registerRequest: (
    classId: string,
    body: {
      email: string;
      fullName: string;
      phone?: string;
      message?: string;
      className?: string;
      classDate?: string;
    },
  ) =>
    api<{ success: boolean; message: string }>(`/schedule/${classId}/register-request`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
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
