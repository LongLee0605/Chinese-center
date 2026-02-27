import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { quizzesApi, type QuizPublic, type QuizSubmitResult } from '@/lib/api';

type AnswersState = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN_LEN = 2;
const NAME_MAX_LEN = 100;

function validateGuestInfo(name: string, email: string): { name?: string; email?: string } {
  const err: { name?: string; email?: string } = {};
  const n = name.trim();
  if (!n) err.name = 'Vui lòng nhập họ và tên.';
  else if (n.length < NAME_MIN_LEN) err.name = `Họ tên phải có ít nhất ${NAME_MIN_LEN} ký tự.`;
  else if (n.length > NAME_MAX_LEN) err.name = `Họ tên không quá ${NAME_MAX_LEN} ký tự.`;
  const e = email.trim();
  if (!e) err.email = 'Vui lòng nhập email.';
  else if (!EMAIL_REGEX.test(e)) err.email = 'Email không đúng định dạng.';
  return err;
}

export default function QuizTestPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quiz, setQuiz] = useState<QuizPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    quizzesApi
      .getBySlug(slug)
      .then((q) => {
        setQuiz(q);
        setAnswers({});
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'Không tải được bài test.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const mcQuestions = useMemo(
    () => quiz?.questions.filter((q) => q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') ?? [],
    [quiz],
  );
  const essayQuestions = useMemo(
    () => quiz?.questions.filter((q) => q.type === 'ESSAY' || q.type === 'SHORT_ANSWER') ?? [],
    [quiz],
  );

  const handleChangeAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    const validation = validateGuestInfo(guestName, guestEmail);
    if (validation.name || validation.email) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        answers,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      };
      const res = await quizzesApi.submitAttempt(quiz.id, body);
      setResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nộp bài thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel={quiz?.title || 'Bài kiểm tra'} />
      <section className="section-padding">
        <div className="container-narrow">
          <SectionTitle
            overline="Bài kiểm tra"
            title={quiz?.title || 'Đang tải bài kiểm tra...'}
            subtitle={
              quiz?.description ||
              'Hãy làm bài một cách trung thực để giáo viên đánh giá chính xác trình độ của bạn.'
            }
          />

          {loading && <p className="mt-6 text-center text-primary-600">Đang tải bài kiểm tra...</p>}
          {error && !loading && <p className="mt-6 text-center text-red-600">{error}</p>}

          {!loading && !error && quiz && result && (
            <div className="mt-8">
              <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-accent-800 mb-2">Kết quả bài kiểm tra</h2>
                <p className="text-sm text-accent-700 mb-4">
                  Điểm phần trắc nghiệm: <span className="font-semibold">{result.score}%</span> (
                  {result.mcCorrect}/{result.mcTotal} câu đúng).
                </p>
                <p className="text-sm text-accent-700 mb-2">
                  Trạng thái:{' '}
                  <span className="font-semibold">
                    {result.passed ? 'Đạt yêu cầu' : 'Chưa đạt, cần luyện thêm'}
                  </span>
                </p>
                {result.hasEssayPending && (
                  <p className="text-sm text-accent-700 mb-4">
                    Phần tự luận của bạn đã được ghi nhận và sẽ được giáo viên chấm trong thời gian sớm nhất.
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link to="/dang-ky-hoc-thu">
                    <Button size="sm">Đăng ký buổi tư vấn / học thử</Button>
                  </Link>
                  <Link to="/khoa-hoc">
                    <Button size="sm" variant="outline">
                      Xem các khóa học
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && quiz && !result && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              <div className="rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-semibold text-primary-900">Thông tin học viên <span className="text-red-500">*</span></h2>
                <p className="text-sm text-primary-600">
                  Vui lòng nhập họ tên và email đúng quy định để nộp bài kiểm tra.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => { setGuestName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
                        fieldErrors.name ? 'border-red-500' : 'border-primary-200',
                      )}
                      placeholder="VD: Nguyễn Văn A"
                      required
                      minLength={NAME_MIN_LEN}
                      maxLength={NAME_MAX_LEN}
                    />
                    {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-800 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => { setGuestEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
                        fieldErrors.email ? 'border-red-500' : 'border-primary-200',
                      )}
                      placeholder="you@example.com"
                      required
                    />
                    {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
                  </div>
                </div>
              </div>

              {mcQuestions.length > 0 && (
                <div className="rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-semibold text-primary-900">Câu hỏi trắc nghiệm</h2>
                  <p className="text-sm text-primary-600">
                    Chọn một đáp án đúng cho mỗi câu. Một số câu có thể là Đúng/Sai (true/false).
                  </p>
                  <div className="space-y-6">
                    {mcQuestions.map((q, index) => (
                      <div key={q.id} className="border border-primary-100 rounded-xl p-4 sm:p-5">
                        <p className="text-sm text-primary-500 mb-1">
                          Câu {index + 1} / {mcQuestions.length}
                        </p>
                        <p className="font-medium text-primary-900 mb-3">{q.questionText}</p>
                        <div className="space-y-2 mt-2">
                          {(q.options ?? []).map((opt) => {
                            const value = opt;
                            const checked = answers[q.id] === value;
                            return (
                              <label
                                key={opt}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer',
                                  checked
                                    ? 'border-accent-500 bg-accent-50'
                                    : 'border-primary-200 hover:border-accent-200 hover:bg-accent-50/40',
                                )}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={value}
                                  checked={checked}
                                  onChange={(e) => handleChangeAnswer(q.id, e.target.value)}
                                  className="h-4 w-4 text-accent-600 focus:ring-accent-500"
                                />
                                <span className="text-primary-900">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {essayQuestions.length > 0 && (
                <div className="rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-semibold text-primary-900">Câu hỏi tự luận</h2>
                  <p className="text-sm text-primary-600">
                    Hãy trả lời chi tiết nhất có thể. Giáo viên sẽ chấm phần này sau khi bạn nộp bài.
                  </p>
                  <div className="space-y-6">
                    {essayQuestions.map((q, index) => (
                      <div key={q.id} className="border border-primary-100 rounded-xl p-4 sm:p-5">
                        <p className="text-sm text-primary-500 mb-1">
                          Câu {index + 1} / {essayQuestions.length}
                        </p>
                        <p className="font-medium text-primary-900 mb-3">{q.questionText}</p>
                        <textarea
                          value={answers[q.id] ?? ''}
                          onChange={(e) => handleChangeAnswer(q.id, e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Nhập câu trả lời của bạn..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-primary-500">
                  Sau khi nộp bài, hệ thống sẽ tự chấm phần trắc nghiệm. Phần tự luận sẽ được giáo viên xem và chấm điểm
                  sau.
                </p>
                <Button type="submit" size="lg" disabled={submitting || !quiz}>
                  {submitting ? 'Đang nộp bài...' : 'Nộp bài kiểm tra'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

