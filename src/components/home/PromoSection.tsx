import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const PROMOS = [
  {
    id: '1',
    title: 'Giảm 20% học phí khóa đầu',
    desc: 'Áp dụng cho học viên mới đăng ký bất kỳ khóa HSK 1–3 trong tháng này.',
    cta: 'Đăng ký ngay',
    to: '/dang-ky-hoc-thu',
    highlight: true,
  },
  {
    id: '2',
    title: 'Học thử 1 buổi miễn phí',
    desc: 'Trải nghiệm lớp học thật, gặp giáo viên và được tư vấn lộ trình.',
    cta: 'Đặt lịch học thử',
    to: '/dang-ky-hoc-thu',
    highlight: false,
  },
];

export default function PromoSection() {
  return (
    <section className="section-padding bg-white border-y border-primary-100">
      <div className="container-wide">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {PROMOS.map((promo, i) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex-1 rounded-2xl p-6 sm:p-8 ${
                promo.highlight
                  ? 'bg-primary-900 text-white'
                  : 'bg-primary-50 border border-primary-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`shrink-0 rounded-xl p-2.5 ${promo.highlight ? 'bg-white/20' : 'bg-accent-100'}`}>
                  <Gift className={promo.highlight ? 'h-6 w-6 text-white' : 'h-6 w-6 text-accent-600'} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{promo.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${promo.highlight ? 'text-primary-200' : 'text-primary-600'}`}>
                    {promo.desc}
                  </p>
                  <Link to={promo.to} className="mt-4 inline-block">
                    <Button
                      size="sm"
                      className={promo.highlight ? 'bg-accent-500 text-primary-900 hover:bg-accent-400 focus:ring-accent-500' : ''}
                    >
                      {promo.cta}
                      <ArrowRight className="ml-1.5 h-4 w-4 inline-block" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
