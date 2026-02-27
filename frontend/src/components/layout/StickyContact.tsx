import { useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOTLINE = '02812345678';
const ZALO_LINK = 'https://zalo.me/0901234567';

export default function StickyContact() {
  const [active, setActive] = useState<'phone' | 'zalo' | null>(null);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 sm:bottom-6 sm:right-6 pb-safe">
      <div className="relative">
        {active === 'phone' && (
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-900 px-3 py-2 text-sm font-medium text-white shadow-lg whitespace-nowrap">
            Gọi: {HOTLINE}
          </span>
        )}
        <a
          href={`tel:${HOTLINE.replace(/\s/g, '')}`}
          className={cn(
            'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary-900 text-white shadow-lg transition-all hover:bg-primary-800 hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
          )}
          aria-label={`Gọi hotline ${HOTLINE}`}
          onMouseEnter={() => setActive('phone')}
          onMouseLeave={() => setActive(null)}
        >
          <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
        </a>
      </div>

      <div className="relative">
        {active === 'zalo' && (
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-900 px-3 py-2 text-sm font-medium text-white shadow-lg whitespace-nowrap">
            Chat Zalo
          </span>
        )}
        <a
          href={ZALO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-lg transition-all hover:bg-[#0052cc] hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-[#0068FF] focus:ring-offset-2',
          )}
          aria-label="Chat Zalo"
          onMouseEnter={() => setActive('zalo')}
          onMouseLeave={() => setActive(null)}
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
        </a>
      </div>
    </div>
  );
}
