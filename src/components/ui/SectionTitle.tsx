import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  overline?: string;
  title: ReactNode;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}

export default function SectionTitle({
  overline,
  title,
  subtitle,
  className,
  align = 'center',
}: SectionTitleProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {overline && (
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600 mb-3">{overline}</p>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 tracking-tight">{title}</h2>
      {subtitle && (
        <p className={cn('mt-4 sm:mt-5 text-base sm:text-lg text-primary-600 leading-relaxed', align === 'center' && 'max-w-2xl mx-auto')}>{subtitle}</p>
      )}
    </div>
  );
}
