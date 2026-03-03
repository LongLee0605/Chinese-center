import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBase, getAuthToken } from '@/lib/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBase(),
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      const token = getAuthToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Posts', 'Post', 'Courses', 'Course', 'Teachers', 'Me'],
  endpoints: (builder) => ({
    getMe: builder.query<
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        role: string;
        status: string;
        enrollments?: { courseId: string; courseName: string; courseSlug: string; enrolledAt: string; totalLessons: number; completedLessons: number; percentProgress: number }[];
        quizAttempts?: { id: string; quizId: string; quizTitle: string; quizSlug: string; score: number | null; submittedAt: string | null }[];
      },
      void
    >({
      query: () => '/users/me',
      providesTags: ['Me'],
    }),
    getPosts: builder.query<
      { items: { id: string; title: string; slug: string; excerpt?: string; publishedAt?: string }[]; total: number },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => `/posts?page=${page}&limit=${limit}`,
      providesTags: ['Posts'],
    }),
    getPostBySlug: builder.query<
      { id: string; title: string; slug: string; body?: string; excerpt?: string; publishedAt?: string; coverImage?: string | null },
      string
    >({
      query: (slug) => `/posts/by-slug/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'Post', id: slug }],
    }),
    getCourses: builder.query<
      { items: { id: string; name: string; nameZh?: string; slug: string; level?: string; duration?: number; price?: number; description?: string; thumbnail?: string }[] },
      void
    >({
      query: () => '/courses/public?limit=50',
      providesTags: ['Courses'],
    }),
    getCourseBySlug: builder.query<
      {
        id: string;
        name: string;
        nameZh?: string | null;
        slug: string;
        description?: string | null;
        learningObjectives?: string | null;
        level: string;
        duration: number;
        price?: number;
        lessons: {
          id: string;
          title: string;
          slug: string;
          orderIndex: number;
          durationMinutes?: number | null;
          type: string;
          content?: string | null;
          videoUrl?: string | null;
        }[];
      },
      string
    >({
      query: (slug) => `/courses/by-slug/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'Course', id: slug }],
    }),
    getTeachers: builder.query<
      { items: { id: string; name: string; title?: string; bio?: string; avatarPath?: string; specializations?: string[]; yearsExperience?: number }[] },
      void
    >({
      query: () => '/teachers',
      providesTags: ['Teachers'],
    }),
    submitLead: builder.mutation<{ id: string }, { type: string; name: string; email: string; phone: string; message?: string; courseInterest?: string; timePreference?: string; note?: string }>({
      query: (body) => ({
        url: '/leads',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostBySlugQuery,
  useGetCoursesQuery,
  useGetCourseBySlugQuery,
  useGetTeachersQuery,
  useSubmitLeadMutation,
  useGetMeQuery,
} = apiSlice;
