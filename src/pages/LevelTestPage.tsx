import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

const QUESTIONS = [
  { id: '1', q: 'Bạn đã học tiếng Trung bao lâu?', options: [{ label: 'Chưa từng học', score: 0 }, { label: 'Dưới 3 tháng', score: 1 }, { label: '3–12 tháng', score: 2 }, { label: 'Trên 1 năm', score: 3 }] },
  { id: '2', q: 'Bạn có thể giới thiệu bản thân bằng tiếng Trung không?', options: [{ label: 'Không', score: 0 }, { label: 'Vài câu đơn giản', score: 1 }, { label: 'Có, trôi chảy', score: 2 }, { label: 'Có, và thảo luận chủ đề quen thuộc', score: 3 }] },
  { id: '3', q: 'Bạn đã thi HSK hoặc tương đương chưa?', options: [{ label: 'Chưa', score: 0 }, { label: 'HSK 1 hoặc 2', score: 1 }, { label: 'HSK 3 hoặc 4', score: 2 }, { label: 'HSK 5 hoặc 6', score: 3 }] },
  { id: '4', q: 'Mục tiêu học tập của bạn?', options: [{ label: 'Giao tiếp cơ bản, du lịch', score: 0 }, { label: 'Đọc hiểu, thi HSK 2–3', score: 1 }, { label: 'Công việc, HSK 4–5', score: 2 }, { label: 'Học thuật / dịch, HSK 6', score: 3 }] },
];

const LEVEL_RESULTS: Record<string, { name: string; desc: string; slug: string }> = {
  HSK1: { name: 'HSK 1 - Nhập môn', desc: 'Phù hợp người mới bắt đầu. Khóa học 150 từ vựng, ngữ pháp cơ bản.', slug: 'hsk1-nhap-mon' },
  HSK2: { name: 'HSK 2 - Sơ cấp', desc: 'Bạn đã có nền tảng. Nên học tiếp 300 từ, giao tiếp hàng ngày.', slug: 'hsk2-so-cap' },
  HSK3: { name: 'HSK 3 - Trung cấp', desc: 'Trình độ trung cấp. Khóa 600 từ, giao tiếp công việc và du lịch.', slug: 'hsk3-trung-cap' },
  HSK4: { name: 'HSK 4 trở lên', desc: 'Trình độ khá. Có thể chọn khóa luyện thi HSK 4–6 hoặc tiếng Trung thương mại.', slug: 'hsk4' },
};

function getLevel(score: number): string {
  if (score <= 3) return 'HSK1';
  if (score <= 6) return 'HSK2';
  if (score <= 9) return 'HSK3';
  return 'HSK4';
}

export default function LevelTestPage() {
  const [step, setStep] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[step];
  const resultKey = getLevel(totalScore);
  const result = LEVEL_RESULTS[resultKey];

  const handleAnswer = (score: number) => {
    if (step < QUESTIONS.length - 1) {
      setTotalScore((s) => s + score);
      setStep((s) => s + 1);
    } else {
      setTotalScore((s) => s + score);
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Kiểm tra trình độ" />
      <section className="section-padding">
        <div className="container-narrow">
          <SectionTitle
            overline="Tự đánh giá"
            title="Kiểm tra trình độ tiếng Trung"
            subtitle="Trả lời vài câu hỏi để chúng tôi gợi ý khóa học phù hợp. Kết quả chỉ mang tính tham khảo."
          />

          <AnimatePresence mode="wait">
            {!done ? (
              current && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mt-10 rounded-2xl border border-primary-200 bg-white p-6 sm:p-8"
                >
                  <p className="text-sm text-primary-500 mb-2">
                    Câu {step + 1} / {QUESTIONS.length}
                  </p>
                  <h3 className="text-xl font-bold text-primary-900 mb-6">{current.q}</h3>
                  <div className="space-y-3">
                    {current.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleAnswer(opt.score)}
                        className={cn(
                          'w-full text-left rounded-xl border-2 border-primary-200 px-4 py-4 sm:py-3 font-medium transition-all',
                          'min-h-[48px] touch-manipulation',
                          'hover:border-accent-300 hover:bg-accent-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 text-center"
              >
                <p className="text-accent-600 font-semibold mb-2">Kết quả gợi ý</p>
                <h2 className="text-2xl font-bold text-primary-900 mb-2">{result.name}</h2>
                <p className="text-primary-600 mb-8 max-w-md mx-auto">{result.desc}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to={`/khoa-hoc#${result.slug}`}>
                    <Button size="lg">Xem khóa học phù hợp</Button>
                  </Link>
                  <Link to="/dang-ky-hoc-thu">
                    <Button variant="outline" size="lg">Đăng ký học thử miễn phí</Button>
                  </Link>
                  <Link to="/bai-test/kiem-tra-ki-nang-cua-ban-than">
                    <Button variant="ghost" size="lg">
                      Kiểm tra kỹ năng chi tiết
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
