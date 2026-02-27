import { motion } from 'framer-motion';

const stats = [
  { value: '10+', label: 'Năm kinh nghiệm' },
  { value: '50+', label: 'Giáo viên chuyên môn' },
  { value: '5.000+', label: 'Học viên đã tốt nghiệp' },
  { value: '98%', label: 'Hài lòng với khóa học' },
];

export default function StatsBar() {
  return (
    <section className="border-y border-primary-200 bg-white py-6 sm:py-8">
      <div className="container-wide px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-accent-600">{value}</p>
              <p className="mt-1 text-sm font-medium text-primary-600">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
