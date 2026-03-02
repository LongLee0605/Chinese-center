import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getApiBase } from '@/lib/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBase(),
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Posts', 'Post', 'Courses', 'Teachers'],
  endpoints: (builder) => ({
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
      query: () => '/courses?limit=50',
      providesTags: ['Courses'],
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
  useGetTeachersQuery,
  useSubmitLeadMutation,
} = apiSlice;
