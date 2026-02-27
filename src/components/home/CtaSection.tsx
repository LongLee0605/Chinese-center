import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CtaSection() {
  return (
    <section className="section-padding bg-primary-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-600/10 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="container-wide relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Bắt đầu hành trình học tiếng Trung
          </h2>
          <p className="mt-4 text-base sm:text-lg text-primary-300">
            Đăng ký học thử miễn phí 1 buổi. Không mất phí, không ràng buộc.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link to="/dang-ky-hoc-thu">
              <Button
                size="lg"
                className="bg-accent-500 text-primary-900 hover:bg-accent-400 focus:ring-accent-500 group"
              >
                Đăng ký ngay
                <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/khoa-hoc">
              <Button variant="outline" size="lg" className="border-primary-500 text-white hover:bg-primary-800 focus:ring-primary-500">
                Xem khóa học
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
