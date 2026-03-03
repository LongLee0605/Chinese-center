// Local: .env.development hoặc fallback localhost
// Production: .env.production hoặc fallback Render
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:4000/api/v1'
    : 'https://chinese-center.onrender.com/api/v1');

/** Base URL của API (dùng chung cho fetch). */
export function getApiBase(): string {
  return API_BASE;
}

/** Gốc URL để build đường dẫn upload (avatar, v.v.). */
export function getUploadsBase(): string {
  return API_BASE.replace(/\/api\/v1\/?$/, '');
}

/** Build URL avatar từ path lưu trong DB. */
export function avatarUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  return `${getUploadsBase()}/uploads/${avatarPath}`;
}

/** Build URL ảnh từ path (cover, thumbnail, ...). Luôn dùng base hiện tại để tránh lỗi local/production. */
export function toImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${getUploadsBase()}/uploads/${path}`;
}

/** Placeholder lưu trong DB thay cho full URL ảnh (tránh localhost khi xem production). */
export const UPLOADS_PLACEHOLDER = '__UPLOADS__/';

/** Chuẩn hóa body HTML trước khi lưu: thay mọi base upload bằng placeholder. */
export function bodyHtmlForSave(html: string): string {
  if (!html) return html;
  return html.replace(/https?:\/\/[^/"'\s]+\/uploads\//gi, UPLOADS_PLACEHOLDER);
}

/** Chuẩn hóa body HTML khi hiển thị: thay placeholder và URL upload cũ bằng base hiện tại. */
export function bodyHtmlForDisplay(html: string): string {
  if (!html) return html;
  const base = `${getUploadsBase()}/uploads/`;
  let out = html.replace(new RegExp(UPLOADS_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), base);
  out = out.replace(/src="(https?:\/\/[^"]+)\/uploads\/([^"]+)"/gi, (_m, _host, path) => `src="${base}${path}"`);
  return out;
}

function getToken(): string | null {
  return localStorage.getItem('crm_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: { id: string; email: string; firstName: string; lastName: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () => api<{ id: string; email: string; firstName: string; lastName: string; role: string }>('/auth/me'),
};

export const postsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return api<{ items: unknown[]; total: number }>(`/posts/crm/list?${q}`);
  },
  get: (id: string) => api<unknown>(`/posts/crm/${id}`),
  create: (body: Record<string, unknown>) => api<unknown>('/posts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<unknown>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/posts/${id}`, { method: 'DELETE' }),
  /** Upload ảnh cho nội dung bài viết. Trả về path (vd: posts/xxx.jpg) để build URL: getUploadsBase() + '/uploads/' + path */
  uploadImage: async (file: File): Promise<{ path: string }> => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/posts/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message || 'Upload thất bại');
    }
    return res.json();
  },
};

export const coursesApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return api<{ items: unknown[]; total: number }>(`/courses?${q}`);
  },
  get: (id: string) => api<unknown>(`/courses/${id}`),
  create: (body: Record<string, unknown>) => api<unknown>('/courses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<unknown>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/courses/${id}`, { method: 'DELETE' }),
  getEnrollments: (courseId: string) =>
    api<Array<{ id: string; userId: string; enrolledAt: string; user: { id: string; email: string; firstName: string; lastName: string } }>>(`/courses/${courseId}/enrollments`),
  addEnrollment: (courseId: string, userId: string) =>
    api<unknown>(`/courses/${courseId}/enrollments`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeEnrollment: (courseId: string, enrollmentId: string) =>
    api<unknown>(`/courses/${courseId}/enrollments/${enrollmentId}`, { method: 'DELETE' }),
  uploadImage: async (file: File): Promise<{ path: string }> => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/courses/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message || 'Upload thất bại');
    }
    return res.json();
  },
};

export const enrollmentRequestsApi = {
  list: (params?: { courseId?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.courseId) q.set('courseId', params.courseId);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: EnrollmentRequest[]; total: number; page: number; limit: number }>(`/enrollment-requests?${q}`);
  },
  create: (courseId: string) =>
    api<EnrollmentRequest>('/enrollment-requests', { method: 'POST', body: JSON.stringify({ courseId }) }),
  review: (id: string, body: { status: 'APPROVED' | 'REJECTED'; note?: string }) =>
    api<EnrollmentRequest>(`/enrollment-requests/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export type EnrollmentRequest = {
  id: string;
  userId: string;
  courseId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  user: { id: string; email: string; firstName: string; lastName: string; phone?: string | null };
  course: { id: string; name: string; slug: string };
};

export const trialRegistrationsApi = {
  list: (params?: { courseId?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.courseId) q.set('courseId', params.courseId);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: TrialRegistration[]; total: number; page: number; limit: number }>(`/trial-registrations?${q}`);
  },
  review: (id: string, body: { status: 'APPROVED' | 'REJECTED'; note?: string }) =>
    api<TrialRegistration>(`/trial-registrations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export type TrialRegistration = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  courseId: string;
  message?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdUserId?: string | null;
  course: { id: string; name: string; slug: string };
};

export type NotificationCounts = {
  enrollmentRequestsPending: number;
  trialPending: number;
  leadsLast7Days: number;
  total: number;
};

export const notificationsApi = {
  getCounts: () => api<NotificationCounts>('/notifications/counts'),
};

export type SearchResult = {
  posts: Array<{ id: string; title: string; slug: string; status: string }>;
  courses: Array<{ id: string; name: string; code: string; slug: string }>;
  quizzes: Array<{ id: string; title: string; slug: string }>;
  leads: Array<{ id: string; type: string; name: string; email: string; createdAt: string }>;
  trialRegistrations: Array<{ id: string; fullName: string; email: string; status: string; courseName?: string }>;
  enrollmentRequests: Array<{
    id: string;
    status: string;
    requestedAt: string;
    userName: string;
    userEmail: string;
    courseId: string;
    courseName: string;
    courseSlug: string;
  }>;
  users: Array<{ id: string; email: string; firstName: string; lastName: string; role: string }>;
};

export const searchApi = {
  search: (q: string, limit?: number) => {
    const params = new URLSearchParams();
    params.set('q', q);
    if (limit != null) params.set('limit', String(limit));
    return api<SearchResult>(`/search?${params}`);
  },
};

export const lessonsApi = {
  byCourse: (courseId: string) =>
    api<unknown[]>(`/lessons/course/${courseId}`),
  get: (id: string) => api<unknown>(`/lessons/${id}`),
  create: (body: Record<string, unknown>) => api<unknown>('/lessons', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<unknown>(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/lessons/${id}`, { method: 'DELETE' }),
  reorder: (courseId: string, orderedIds: string[]) =>
    api<unknown[]>(`/lessons/course/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),
};

export const quizzesApi = {
  list: (params?: { page?: number; limit?: number; courseId?: string; lessonId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.courseId) q.set('courseId', params.courseId);
    if (params?.lessonId) q.set('lessonId', params.lessonId);
    return api<{ items: unknown[]; total: number }>(`/quizzes?${q}`);
  },
  get: (id: string) => api<unknown>(`/quizzes/${id}`),
  getQuestions: (id: string) => api<unknown>(`/quizzes/${id}/questions`),
  create: (body: Record<string, unknown>) => api<unknown>('/quizzes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<unknown>(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/quizzes/${id}`, { method: 'DELETE' }),
  addQuestion: (quizId: string, body: Record<string, unknown>) =>
    api<unknown>(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (questionId: string, body: Record<string, unknown>) =>
    api<unknown>(`/quizzes/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (questionId: string) =>
    api<unknown>(`/quizzes/questions/${questionId}`, { method: 'DELETE' }),
  listAttempts: (quizId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: unknown[]; total: number }>(`/quizzes/${quizId}/attempts?${q}`);
  },
  getAttempt: (attemptId: string) => api<unknown>(`/quizzes/attempt/${attemptId}`),
  updateAttemptScore: (attemptId: string, score: number) =>
    api<unknown>(`/quizzes/attempt/${attemptId}/score`, { method: 'PUT', body: JSON.stringify({ score }) }),
  deleteAttempt: (attemptId: string) =>
    api<unknown>(`/quizzes/attempt/${attemptId}`, { method: 'DELETE' }),
};

export type Lead = {
  id: string;
  type: 'TU_VAN' | 'DANG_KY_HOC_THU';
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  courseInterest?: string | null;
  timePreference?: string | null;
  note?: string | null;
  createdAt: string;
};

export const leadsApi = {
  list: (params?: { page?: number; limit?: number; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    return api<{ items: Lead[]; total: number }>(`/leads?${q}`);
  },
  get: (id: string) => api<Lead>(`/leads/${id}`),
  delete: (id: string) => api<void>(`/leads/${id}`, { method: 'DELETE' }),
};

export type SentEmail = {
  id: string;
  toAddresses: string;
  subject: string;
  text: string | null;
  html: string | null;
  sentAt: string;
};

export const mailApi = {
  send: (body: { to: string | string[]; subject: string; text?: string; html?: string }) =>
    api<{ success: boolean; messageId?: string; id?: string; error?: string }>('/mail/send', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  check: () => api<{ configured: boolean }>('/mail/check', { method: 'POST' }),
  listSent: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: SentEmail[]; total: number }>(`/mail/sent?${q}`);
  },
  getSent: (id: string) => api<SentEmail>(`/mail/sent/${id}`),
  deleteSent: (id: string) => api<void>(`/mail/sent/${id}`, { method: 'DELETE' }),
};

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

export type UserAccount = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  avatar?: string | null;
  title?: string | null;
  bio?: string | null;
  specializations?: string[];
  yearsExperience?: number | null;
  teacherPublic?: boolean;
  teacherOrderIndex?: number;
};

export type UserCreateBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  title?: string;
  bio?: string;
  specializations?: string[];
  yearsExperience?: number;
  teacherPublic?: boolean;
  teacherOrderIndex?: number;
};

export type UserUpdateBody = Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  title: string;
  bio: string;
  specializations: string[];
  yearsExperience: number;
  teacherPublic: boolean;
  teacherOrderIndex: number;
}>;

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.role) q.set('role', params.role);
    return api<{ items: UserAccount[]; total: number; page: number; limit: number }>(`/users?${q}`);
  },
  get: (id: string) => api<UserAccount>(`/users/${id}`),
  create: (body: UserCreateBody) =>
    api<UserAccount>('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UserUpdateBody) =>
    api<UserAccount>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<{ id: string; email: string }>(`/users/${id}`, { method: 'DELETE' }),
  uploadAvatar: async (id: string, file: File): Promise<{ avatarPath: string }> => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/users/${id}/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message || 'Tải ảnh thất bại');
    }
    return res.json();
  },
};

