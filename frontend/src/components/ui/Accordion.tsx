import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  question: string;
  answer: ReactNode;
}

interface AccordionProps {
  items: Item[];
  className?: string;
}

export default function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-primary-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={cn(
                'flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5 text-left min-h-[48px] touch-manipulation',
                'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-inset',
                isOpen ? 'bg-accent-50 text-accent-800' : 'hover:bg-primary-50 text-primary-900',
              )}
              aria-expanded={isOpen}
              aria-controls={`accordion-${item.id}`}
              id={`accordion-heading-${item.id}`}
            >
              <span className="font-semibold text-sm sm:text-base pr-2">{item.question}</span>
              <ChevronDown
                className={cn('h-5 w-5 shrink-0 text-primary-500 transition-transform', isOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-heading-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-4 sm:px-5 sm:py-5 pt-0 text-primary-600 text-sm sm:text-base leading-relaxed border-t border-primary-100">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
