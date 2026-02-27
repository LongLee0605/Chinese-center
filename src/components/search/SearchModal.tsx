import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetCoursesQuery, useGetPostsQuery } from '@/store/apiSlice';

const FALLBACK_COURSES: { id: string; name: string; slug: string; level?: string }[] = [
  { id: '1', name: 'HSK 1 - Nhập môn', slug: 'hsk1-nhap-mon', level: 'HSK1' },
  { id: '2', name: 'HSK 2 - Sơ cấp', slug: 'hsk2-so-cap', level: 'HSK2' },
  { id: '3', name: 'HSK 3 - Trung cấp', slug: 'hsk3-trung-cap', level: 'HSK3' },
  { id: '4', name: 'HSK 4', slug: 'hsk4', level: 'HSK4' },
  { id: '5', name: 'Tiếng Trung thiếu nhi', slug: 'thieu-nhi', level: 'KIDS' },
  { id: '6', name: 'Tiếng Trung doanh nghiệp', slug: 'doanh-nghiep', level: 'BUSINESS' },
];

type CourseItem = { id: string; name: string; slug: string; level?: string };
type PostItem = { id: string; title: string; slug: string };

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesQuery(undefined, { skip: !isOpen });
  const { data: postsData, isLoading: postsLoading } = useGetPostsQuery({ limit: 50 }, { skip: !isOpen });

  const courses: CourseItem[] = useMemo(() => {
    const items = coursesData?.items ?? [];
    if (items.length) return items as CourseItem[];
    return FALLBACK_COURSES;
  }, [coursesData?.items]);

  const posts: PostItem[] = useMemo(
    () => (postsData?.items ?? []).map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
    [postsData?.items],
  );

  const loading = coursesLoading || postsLoading;

  const { courseResults, postResults } = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { courseResults: courses.slice(0, 6), postResults: posts.slice(0, 5) };
    }
    const courseResults = courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.level && c.level.toLowerCase().includes(q)) ||
        c.slug.toLowerCase().includes(q),
    );
    const postResults = posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
    return { courseResults, postResults };
  }, [query, courses, posts]);

  const hasResults = courseResults.length > 0 || postResults.length > 0;
  const isEmpty = query && !hasResults;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-primary-950/60 backdrop-blur-sm p-4 pt-[10vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm khóa học và tin tức"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b border-primary-200 px-4 py-3">
          <Search className="h-5 w-5 text-primary-400 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm khóa học, tin tức (HSK1, thiếu nhi...)"
            className="flex-1 min-w-0 py-2 text-base bg-transparent border-none focus:outline-none focus:ring-0"
            autoFocus
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
            </div>
          ) : isEmpty ? (
            <p className="px-4 py-8 text-center text-primary-500">Không tìm thấy kết quả phù hợp.</p>
          ) : (
            <div className="py-2">
              {courseResults.length > 0 && (
                <div className="px-3 py-1.5">
                  <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">Khóa học</p>
                </div>
              )}
              <ul>
                {courseResults.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/khoa-hoc#${course.slug}`);
                        onClose();
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3 sm:py-3.5 hover:bg-accent-50 flex items-center justify-between gap-2 min-h-[44px] touch-manipulation',
                      )}
                    >
                      <span className="font-medium text-primary-900">{course.name}</span>
                      {course.level && (
                        <span className="text-xs text-primary-500 bg-primary-100 px-2 py-0.5 rounded">
                          {course.level}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {postResults.length > 0 && (
                <>
                  <div className="px-3 py-1.5 border-t border-primary-100">
                    <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">Tin tức</p>
                  </div>
                  <ul>
                    {postResults.map((post) => (
                      <li key={post.id}>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/tin-tuc/${post.slug}`);
                            onClose();
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 sm:py-3.5 hover:bg-accent-50 min-h-[44px] touch-manipulation',
                          )}
                        >
                          <span className="font-medium text-primary-900">{post.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
      <button type="button" onClick={onClose} className="absolute inset-0 -z-10" aria-label="Đóng" />
    </div>
  );
}
