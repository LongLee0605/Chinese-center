const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

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
  score: number;
  mcCorrect: number;
  mcTotal: number;
  totalQuestions: number;
  hasEssayPending: boolean;
  passed: boolean;
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
  submitAttempt: (
    quizId: string,
    body: { answers: Record<string, string>; guestName?: string; guestEmail?: string },
  ) =>
    api<QuizSubmitResult>(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
