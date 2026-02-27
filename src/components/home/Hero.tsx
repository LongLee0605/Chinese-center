import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary-50 bg-hero-pattern">
      <div className="container-wide section-padding">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm font-semibold uppercase tracking-wider text-accent-600 mb-4"
            >
              Trung tâm tiếng Trung chuyên nghiệp
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 tracking-tight leading-[1.15]"
            >
              Học tiếng Trung
              <span className="text-accent-600"> hiệu quả</span>
              <br />
              <span className="font-chinese text-2xl sm:text-3xl lg:text-4xl mt-2 inline-block text-primary-800">
                学中文，找我们
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-5 sm:mt-6 text-base sm:text-lg text-primary-600 max-w-xl leading-relaxed"
            >
              Đội ngũ giáo viên bản ngữ giàu kinh nghiệm, chương trình chuẩn HSK.
              Từ cơ bản đến nâng cao, lớp học nhỏ đảm bảo chất lượng.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4"
            >
              <Link to="/dang-ky-hoc-thu">
                <Button size="lg" className="group bg-accent-500 text-primary-900 hover:bg-accent-600 focus:ring-accent-500">
                  Đăng ký học thử miễn phí
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/khoa-hoc">
                <Button variant="outline" size="lg">
                  <BookOpen className="mr-2 h-5 w-5 inline-block" />
                  Xem khóa học
                </Button>
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] max-w-lg mx-auto lg:ml-auto rounded-2xl bg-gradient-to-br from-accent-100/80 via-primary-100 to-accent-50 border border-primary-200 flex items-center justify-center overflow-hidden">
              <div className="text-center p-8">
                <p className="font-chinese text-5xl sm:text-6xl text-accent-600 font-semibold">汉语</p>
                <p className="mt-2 text-primary-600 font-medium">Chinese Language</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
