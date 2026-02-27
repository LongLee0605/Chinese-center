import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  bio: string;
  avatar?: string | null;
  specializations?: string[];
  yearsExperience?: number;
}

interface TeacherCardProps {
  teacher: Teacher;
  className?: string;
}

export default function TeacherCard({ teacher, className }: TeacherCardProps) {
  const fullName = `${teacher.lastName} ${teacher.firstName}`;

  return (
    <div
      className={cn(
        'rounded-2xl border border-primary-200 bg-white p-5 sm:p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-accent-100',
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-gradient-to-br from-accent-100 to-accent-200/50 flex items-center justify-center text-xl sm:text-2xl font-bold text-accent-700">
          {teacher.lastName.charAt(0)}
          {teacher.firstName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            {teacher.role}
          </p>
          <h3 className="mt-0.5 text-base sm:text-lg font-bold text-primary-900">{fullName}</h3>
          {teacher.yearsExperience != null && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-500">
              <GraduationCap className="h-4 w-4 shrink-0" />
              {teacher.yearsExperience} năm kinh nghiệm
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-primary-600 leading-relaxed line-clamp-3">{teacher.bio}</p>
      {teacher.specializations && teacher.specializations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {teacher.specializations.slice(0, 4).map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
