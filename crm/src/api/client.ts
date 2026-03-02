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
  get: (id: string) => api<unknown>(`/posts/${id}`),
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
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: unknown[]; total: number }>(`/courses?${q}`);
  },
  get: (id: string) => api<unknown>(`/courses/${id}`),
  create: (body: Record<string, unknown>) => api<unknown>('/courses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<unknown>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/courses/${id}`, { method: 'DELETE' }),
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
  list: (params?: { page?: number; limit?: number; courseId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.courseId) q.set('courseId', params.courseId);
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

export type Teacher = {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  specializations: string[];
  yearsExperience?: number | null;
  isPublic: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export const teachersApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api<{ items: Teacher[]; total: number }>(`/teachers/crm/list?${q}`);
  },
  get: (id: string) => api<Teacher>(`/teachers/${id}`),
  create: (body: Partial<Teacher>) => api<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Teacher>) =>
    api<Teacher>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/teachers/${id}`, { method: 'DELETE' }),
  uploadAvatar: async (id: string, file: File): Promise<{ avatarPath: string }> => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/teachers/${id}/avatar`, {
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
      throw new Error(err.message || 'Upload thất bại');
    }
    return res.json();
  },
};
