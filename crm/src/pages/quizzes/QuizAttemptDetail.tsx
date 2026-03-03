import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { quizzesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Trash2 } from 'lucide-react';

type Question = {
  id: string;
  type: string;
  questionText: string;
  options: string[] | null;
  correctAnswer?: string | null;
};
type Attempt = {
  id: string;
  score: number | null;
  answers: Record<string, string>;
  guestName: string | null;
  guestEmail: string | null;
  submittedAt: string | null;
  quiz: { id: string; title: string; questions: Question[] };
  user?: { firstName: string; lastName: string; email: string };
};

const MC_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE'];
const ESSAY_TYPES = ['ESSAY', 'SHORT_ANSWER'];

export default function QuizAttemptDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    quizzesApi
      .getAttempt(attemptId)
      .then((a: unknown) => {
        const at = a as Attempt;
        setAttempt(at);
        setScoreInput(at.score != null ? String(at.score) : '');
      })
      .catch(() => setAttempt(null));
  }, [attemptId]);

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptId || attempt == null) return;
    const score = Math.min(100, Math.max(0, parseInt(scoreInput, 10)));
    if (Number.isNaN(score)) {
      show('error', 'Nhập điểm hợp lệ (0–100).');
      return;
    }
    setSaving(true);
    try {
      await quizzesApi.updateAttemptScore(attemptId, score);
      setAttempt((a) => (a ? { ...a, score } : null));
      show('success', 'Đã cập nhật điểm.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!attemptId || !attempt) return;
    if (!window.confirm('Bạn có chắc muốn xóa bài nộp này? Thao tác không thể hoàn tác.')) return;
    setDeleting(true);
    try {
      await quizzesApi.deleteAttempt(attemptId);
      show('success', 'Đã xóa bài nộp.');
      navigate(`/quizzes/${attempt.quiz.id}`, { replace: true });
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  if (!attempt) return <div className="p-6">Đang tải hoặc không tìm thấy bài nộp.</div>;

  const displayName = attempt.guestName || (attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : '—');
  const displayEmail = attempt.guestEmail || attempt.user?.email || '—';
  const isMc = (t: string) => MC_TYPES.includes(t);
  const isEssay = (t: string) => ESSAY_TYPES.includes(t);

  const quizId = attempt.quiz.id;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link to={quizId ? `/quizzes/${quizId}` : '/quizzes'} className="text-sm text-gray-500 hover:underline">
          ← Bài test
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Đang xóa...' : 'Xóa bài nộp'}
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-2">Bài nộp: {attempt.quiz.title}</h1>
      <p className="text-gray-600 mb-4">
        {displayName} · {displayEmail} · {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('vi-VN') : ''}
      </p>
      <p className="mb-6">
        Điểm trắc nghiệm (tự chấm): <strong>{attempt.score != null ? `${attempt.score}%` : 'Chưa chấm'}</strong>
      </p>

      <div className="space-y-6 mb-8">
        {attempt.quiz.questions.map((q) => {
          const userAnswer = attempt.answers?.[q.id] ?? '';
          const correctAnswer = q.correctAnswer ?? '';
          const isCorrect = isMc(q.type) && userAnswer === correctAnswer;

          return (
            <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
              <p className="font-medium text-gray-900 mb-2">{q.questionText}</p>
              <p className="text-sm text-gray-500 mb-1">
                {isEssay(q.type) ? 'Câu trả lời (tự luận):' : 'Đáp án người dùng chọn:'}
              </p>
              {isMc(q.type) ? (
                <div className="space-y-1">
                  {userAnswer ? (
                    <>
                      <p
                        className={
                          isCorrect
                            ? 'text-green-700 font-medium'
                            : 'text-red-600 line-through'
                        }
                      >
                        {userAnswer}
                      </p>
                      {!isCorrect && correctAnswer && (
                        <p className="text-green-700 font-medium mt-1">
                          Đáp án đúng: {correctAnswer}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">— Không chọn</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{userAnswer || '—'}</p>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSaveScore} className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-2">Chấm điểm (tự luận)</h2>
        <p className="text-sm text-gray-600 mb-3">
          Nhập điểm tổng 0–100 (điểm trắc nghiệm đã tự động; có thể cập nhật sau khi chấm tự luận).
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0}
            max={100}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="w-24 border rounded px-3 py-2"
          />
          <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 text-white rounded disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu điểm'}
          </button>
        </div>
      </form>
    </div>
  );
}
