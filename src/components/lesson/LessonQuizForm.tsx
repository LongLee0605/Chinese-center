import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { quizzesApi, type QuizSubmitResult, type QuizMyAttemptsSummary } from '@/lib/api';
import Button from '@/components/ui/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN_LEN = 2;
const NAME_MAX_LEN = 100;

type QuizQuestion = { id: string; type: string; questionText: string; options: string[] | null; orderIndex: number };

type LessonQuizFormProps = {
  quiz: { id: string; title: string; description?: string | null; questions: QuizQuestion[] };
  isLoggedIn: boolean;
  onSubmitted?: (result: QuizSubmitResult) => void;
};

function validateGuest(name: string, email: string): { name?: string; email?: string } {
  const err: { name?: string; email?: string } = {};
  const n = name.trim();
  if (!n) err.name = 'Vui lòng nhập họ tên.';
  else if (n.length < NAME_MIN_LEN) err.name = `Họ tên ít nhất ${NAME_MIN_LEN} ký tự.`;
  else if (n.length > NAME_MAX_LEN) err.name = `Họ tên không quá ${NAME_MAX_LEN} ký tự.`;
  const e = email.trim();
  if (!e) err.email = 'Vui lòng nhập email.';
  else if (!EMAIL_REGEX.test(e)) err.email = 'Email không đúng định dạng.';
  return err;
}

export default function LessonQuizForm({ quiz, isLoggedIn, onSubmitted }: LessonQuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [attemptSummary, setAttemptSummary] = useState<QuizMyAttemptsSummary | null>(null);
  /** Khi đã có lần thử: false = chỉ hiện "đã thử" + Thử lại; true = hiện form câu hỏi */
  const [showFormToRetry, setShowFormToRetry] = useState(true);

  useEffect(() => {
    if (isLoggedIn && quiz.id) {
      quizzesApi
        .getMyAttempts(quiz.id)
        .then((summary) => {
          setAttemptSummary(summary);
          if (summary.attemptsCount > 0) setShowFormToRetry(false);
        })
        .catch(() => setAttemptSummary(null));
    } else {
      setAttemptSummary(null);
    }
  }, [isLoggedIn, quiz.id]);

  const mcQuestions = useMemo(
    () => quiz.questions.filter((q) => q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE'),
    [quiz.questions],
  );
  const essayQuestions = useMemo(
    () => quiz.questions.filter((q) => q.type === 'ESSAY' || q.type === 'SHORT_ANSWER'),
    [quiz.questions],
  );

  const handleChangeAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      const validation = validateGuest(guestName, guestEmail);
      if (validation.name || validation.email) {
        setFieldErrors(validation);
        return;
      }
      setFieldErrors({});
    }
    setError(null);
    setSubmitting(true);
    try {
      const body: { answers: Record<string, string>; guestName?: string; guestEmail?: string } = { answers };
      if (!isLoggedIn) {
        body.guestName = guestName.trim();
        body.guestEmail = guestEmail.trim();
      }
      const res = await quizzesApi.submitAttempt(quiz.id, body);
      setResult(res);
      setShowResultModal(true);
      onSubmitted?.(res);
      if (isLoggedIn) {
        quizzesApi.getMyAttempts(quiz.id).then(setAttemptSummary).catch(() => {});
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <>
        {showResultModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-result-title"
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
              <h2 id="quiz-result-title" className="text-lg font-semibold text-primary-900 mb-4">
                Kết quả bài tập
              </h2>
              <p className="text-sm text-primary-700 mb-1">
                {result.attemptNumber != null && (
                  <>Lần thử thứ <span className="font-semibold">{result.attemptNumber}</span>.</>
                )}
              </p>
              <p className="text-sm text-primary-700 mb-2">
                Điểm trắc nghiệm: <span className="font-semibold">{result.score != null ? `${result.score}%` : '—'}</span>
                {result.mcTotal > 0 && ` (${result.mcCorrect}/${result.mcTotal} câu đúng)`}.
              </p>
              <p className="text-sm font-medium text-primary-800 mb-2">
                {result.passed ? 'Đạt yêu cầu.' : 'Chưa đạt. Bạn có thể làm lại.'}
              </p>
              {result.hasEssayPending && (
                <p className="text-sm text-primary-600 mb-4">Phần tự luận sẽ được giáo viên chấm sau.</p>
              )}
              <Button type="button" onClick={() => setShowResultModal(false)} className="w-full">
                Đóng
              </Button>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-accent-800 mb-2">Kết quả bài tập</h3>
          <p className="text-sm text-accent-700 mb-2">
            {result.attemptNumber != null && <>Lần thử thứ <span className="font-semibold">{result.attemptNumber}</span>. </>}
            Điểm trắc nghiệm: <span className="font-semibold">{result.score != null ? `${result.score}%` : '—'}</span>
            {result.mcTotal > 0 && ` (${result.mcCorrect}/${result.mcTotal} câu đúng)`}.
          </p>
          <p className="text-sm text-accent-700">
            {result.passed ? 'Đạt yêu cầu.' : 'Chưa đạt. Bạn có thể xem lại tài liệu và làm lại.'}
          </p>
          {result.hasEssayPending && (
            <p className="text-sm text-accent-700 mt-2">Phần tự luận sẽ được giáo viên chấm sau.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => { setResult(null); setShowResultModal(false); setAnswers({}); setShowFormToRetry(false); }}
          >
            Thử lại
          </Button>
        </div>
      </>
    );
  }

  // Đã có lần thử (đăng nhập): chỉ hiện thống kê + nút Thử lại, không hiện câu hỏi
  if (isLoggedIn && attemptSummary && attemptSummary.attemptsCount > 0 && !showFormToRetry) {
    return (
      <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">Bài tập</h3>
        <p className="text-sm text-primary-700 mb-4">
          Đã thử <span className="font-semibold">{attemptSummary.attemptsCount}</span> lần.
          Điểm gần nhất:{' '}
          <span className="font-semibold">
            {attemptSummary.latestScore != null ? `${attemptSummary.latestScore}%` : '—'}
          </span>
        </p>
        <Button type="button" size="sm" onClick={() => setShowFormToRetry(true)}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {attemptSummary && attemptSummary.attemptsCount > 0 && showFormToRetry && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">
          Đã thử <span className="font-semibold">{attemptSummary.attemptsCount}</span> lần.
          Điểm gần nhất:{' '}
          <span className="font-semibold">
            {attemptSummary.latestScore != null ? `${attemptSummary.latestScore}%` : '—'}
          </span>
        </div>
      )}
      {!isLoggedIn && (
        <div className="rounded-xl border border-primary-200 bg-white p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold text-primary-900">Thông tin của bạn (để nộp bài)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Họ tên</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => { setGuestName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                className={cn('w-full rounded-lg border px-3 py-2 text-sm', fieldErrors.name ? 'border-red-500' : 'border-primary-200')}
                placeholder="Nguyễn Văn A"
                required
                minLength={NAME_MIN_LEN}
                maxLength={NAME_MAX_LEN}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => { setGuestEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                className={cn('w-full rounded-lg border px-3 py-2 text-sm', fieldErrors.email ? 'border-red-500' : 'border-primary-200')}
                placeholder="you@example.com"
                required
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
          </div>
        </div>
      )}

      {quiz.description && <p className="text-sm text-primary-600">{quiz.description}</p>}

      {mcQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary-900">Câu hỏi trắc nghiệm</h3>
          <div className="space-y-4">
            {mcQuestions.map((q, idx) => (
              <div key={q.id} className="border border-primary-100 rounded-xl p-4">
                <p className="text-xs text-primary-500 mb-1">Câu {idx + 1}/{mcQuestions.length}</p>
                <p className="font-medium text-primary-900 mb-2">{q.questionText}</p>
                <div className="space-y-2">
                  {(q.options ?? []).map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer',
                        answers[q.id] === opt ? 'border-accent-500 bg-accent-50' : 'border-primary-200 hover:border-accent-200',
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleChangeAnswer(q.id, e.target.value)}
                        className="h-4 w-4 text-accent-600"
                      />
                      <span className="text-primary-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {essayQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary-900">Câu hỏi tự luận</h3>
          <div className="space-y-4">
            {essayQuestions.map((q, idx) => (
              <div key={q.id} className="border border-primary-100 rounded-xl p-4">
                <p className="text-xs text-primary-500 mb-1">Câu {idx + 1}/{essayQuestions.length}</p>
                <p className="font-medium text-primary-900 mb-2">{q.questionText}</p>
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleChangeAnswer(q.id, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm"
                  placeholder="Nhập câu trả lời..."
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? 'Đang nộp...' : 'Nộp bài tập'}
      </Button>
    </form>
  );
}
