import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  BookOpen,
  ClipboardList,
  Inbox,
  UserPlus,
  Send,
  UserCog,
  Loader2,
  Command,
} from 'lucide-react';
import { searchApi, type SearchResult } from '../api/client';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 6;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

const groupLabels: Record<keyof SearchResult, { label: string; icon: typeof FileText; basePath: string }> = {
  posts: { label: 'Bài viết', icon: FileText, basePath: '/posts' },
  courses: { label: 'Khóa học', icon: BookOpen, basePath: '/courses' },
  quizzes: { label: 'Bài test', icon: ClipboardList, basePath: '/quizzes' },
  leads: { label: 'Lead', icon: Inbox, basePath: '/leads' },
  trialRegistrations: { label: 'Học thử', icon: UserPlus, basePath: '/trial-registrations' },
  enrollmentRequests: { label: 'Yêu cầu đăng ký', icon: Send, basePath: '/courses' },
  users: { label: 'Tài khoản', icon: UserCog, basePath: '/accounts' },
};

function itemUrl(
  key: keyof SearchResult,
  item: Record<string, unknown>
): string {
  switch (key) {
    case 'posts':
      return `/posts/${item.id}`;
    case 'courses':
      return `/courses/${item.id}`;
    case 'quizzes':
      return `/quizzes/${item.id}`;
    case 'leads':
      return `/leads/${item.id}`;
    case 'trialRegistrations':
      return `/trial-registrations`;
    case 'enrollmentRequests':
      return `/courses/${(item as { courseId: string }).courseId}`;
    case 'users':
      return `/accounts/${item.id}`;
    default:
      return groupLabels[key]?.basePath ?? '#';
  }
}

function itemTitle(key: keyof SearchResult, item: Record<string, unknown>): string {
  switch (key) {
    case 'posts':
      return (item.title as string) ?? '';
    case 'courses':
      return (item.name as string) ?? (item.code as string) ?? '';
    case 'quizzes':
      return (item.title as string) ?? '';
    case 'leads':
      return (item.name as string) ?? (item.email as string) ?? '';
    case 'trialRegistrations':
      return (item.fullName as string) ?? (item.email as string) ?? '';
    case 'enrollmentRequests':
      return `${(item as { userName: string }).userName} → ${(item as { courseName: string }).courseName}`;
    case 'users':
      return ([item.firstName, item.lastName].filter(Boolean).join(' ') || (item.email as string)) ?? '';
    default:
      return String(item.id ?? '');
  }
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  const runSearch = useCallback(async () => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResult(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.search(debouncedQuery, DEFAULT_LIMIT);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tìm kiếm');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showDropdown = open && (query.length > 0 || loading);
  const hasAny =
    result &&
    (result.posts.length > 0 ||
      result.courses.length > 0 ||
      result.quizzes.length > 0 ||
      result.leads.length > 0 ||
      result.trialRegistrations.length > 0 ||
      result.enrollmentRequests.length > 0 ||
      result.users.length > 0);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    setResult(null);
    navigate(url);
  };

  const groups: (keyof SearchResult)[] = [
    'posts',
    'courses',
    'quizzes',
    'leads',
    'trialRegistrations',
    'enrollmentRequests',
    'users',
  ];

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus-within:border-crm-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-crm-accent/20"
        onClick={() => setOpen(true)}
      >
        <Search size={18} className="shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Tìm bài viết, khóa học, lead, tài khoản… (Ctrl+K)"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          aria-label="Tìm kiếm toàn hệ thống"
        />
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline-flex">
          <Command size={10} />K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Đang tìm...</span>
            </div>
          ) : error ? (
            <p className="px-4 py-4 text-sm text-red-600">{error}</p>
          ) : debouncedQuery.length < MIN_QUERY_LENGTH ? (
            <p className="px-4 py-4 text-sm text-slate-500">Nhập ít nhất 2 ký tự.</p>
          ) : !hasAny ? (
            <p className="px-4 py-4 text-sm text-slate-500">Không tìm thấy kết quả.</p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {groups.map((key) => {
                const items = result![key] as unknown[];
                if (!items?.length) return null;
                const { label, icon: Icon } = groupLabels[key];
                return (
                  <div key={key} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Icon size={14} />
                      {label}
                    </div>
                    <ul className="space-y-0.5">
                      {items.map((item: Record<string, unknown>) => {
                        const url = itemUrl(key, item);
                        const title = itemTitle(key, item);
                        return (
                          <li key={String(item.id)}>
                            <Link
                              to={url}
                              onClick={(e) => {
                                e.preventDefault();
                                handleSelect(url);
                              }}
                              className="flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                            >
                              <span className="min-w-0 flex-1 truncate">{title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
