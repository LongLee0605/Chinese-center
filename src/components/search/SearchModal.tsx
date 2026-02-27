import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COURSES = [
  { id: '1', name: 'HSK 1 - Nhập môn', slug: 'hsk1-nhap-mon', level: 'HSK1' },
  { id: '2', name: 'HSK 2 - Sơ cấp', slug: 'hsk2-so-cap', level: 'HSK2' },
  { id: '3', name: 'HSK 3 - Trung cấp', slug: 'hsk3-trung-cap', level: 'HSK3' },
  { id: '4', name: 'HSK 4', slug: 'hsk4', level: 'HSK4' },
  { id: '5', name: 'Tiếng Trung thiếu nhi', slug: 'thieu-nhi', level: 'KIDS' },
  { id: '6', name: 'Tiếng Trung doanh nghiệp', slug: 'doanh-nghiep', level: 'BUSINESS' },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return COURSES;
    const q = query.toLowerCase().trim();
    return COURSES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuery('');
    } else {
      document.body.style.overflow = '';
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
      aria-label="Tìm kiếm khóa học"
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
            placeholder="Tìm khóa học (HSK1, thiếu nhi, ...)"
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
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-primary-500">Không tìm thấy khóa học phù hợp.</p>
          ) : (
            <ul className="py-2">
              {results.map((course) => (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/khoa-hoc#${course.slug}`);
                      onClose();
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 sm:py-3.5 hover:bg-accent-50 flex items-center justify-between gap-2',
                      'min-h-[44px] touch-manipulation',
                    )}
                  >
                    <span className="font-medium text-primary-900">{course.name}</span>
                    <span className="text-xs text-primary-500 bg-primary-100 px-2 py-0.5 rounded">
                      {course.level}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Đóng"
      />
    </div>
  );
}
