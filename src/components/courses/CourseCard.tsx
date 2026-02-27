import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Course {
  id: string;
  name: string;
  nameZh?: string | null;
  level: string;
  duration: number;
  price: number;
  slug: string;
  thumbnail?: string | null;
  description?: string | null;
}

interface CourseCardProps {
  course: Course;
  className?: string;
}

export default function CourseCard({ course, className }: CourseCardProps) {
  return (
    <Link
      to={`/khoa-hoc/${course.slug}`}
      className={cn(
        'group block rounded-2xl border border-primary-200 bg-white p-5 sm:p-6 shadow-card transition-all duration-300 hover:border-accent-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        {course.nameZh && (
          <span className="font-chinese text-base sm:text-lg font-medium text-primary-500">{course.nameZh}</span>
        )}
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-bold text-primary-900 group-hover:text-accent-600 transition-colors">
        {course.name}
      </h3>
      {course.description && (
        <p className="mt-2 text-sm text-primary-600 line-clamp-2">{course.description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-primary-500">
        <span>{course.duration} giờ</span>
        <span>•</span>
        <span className="font-semibold text-accent-600">{formatCurrency(course.price)}</span>
      </div>
    </Link>
  );
}
