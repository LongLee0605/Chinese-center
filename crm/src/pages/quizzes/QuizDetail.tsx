import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizzesApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react';

const QUIZ_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE_ONLY: 'Trắc nghiệm',
  ESSAY_ONLY: 'Tự luận',
  MIXED: 'Hỗn hợp (trắc nghiệm + tự luận)',
};

const MC_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE'];
const ESSAY_TYPES = ['ESSAY', 'SHORT_ANSWER'];
const MAX_OPTIONS = 5;

type Question = {
  id: string;
  type: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  orderIndex: number;
};

type Quiz = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  quizType?: string;
  timeLimitMinutes?: number;
  passingScore: number;
  isPublished: boolean;
  allowGuest?: boolean;
  visibleToRoles?: string[];
  questions?: Question[];
};

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const isNew = id === 'new' || !id;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [questionType, setQuestionType] = useState<'mc' | 'essay'>('mc');
  const [quizForm, setQuizForm] = useState({
    title: '',
    slug: '',
    description: '',
    quizType: 'MIXED' as string,
    timeLimitMinutes: 0,
    passingScore: 60,
    isPublished: false,
    allowGuest: false,
    visibleToRoles: [] as string[],
  });

  const ROLE_OPTIONS = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'TEACHER', label: 'Giảng viên' },
    { value: 'STUDENT', label: 'Học viên' },
  ];
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', ''],
    correctAnswerIndex: 0,
    correctAnswerText: '',
  });
  const [newQuizForm, setNewQuizForm] = useState({
    title: '',
    slug: '',
    description: '',
    quizType: 'MIXED' as string,
  });
  const [creating, setCreating] = useState(false);
  const [attempts, setAttempts] = useState<{ items: unknown[] } | null>(null);
  const [showAttempts, setShowAttempts] = useState(false);

  useEffect(() => {
    if (!id || isNew) return;
    loadQuiz();
  }, [id, isNew]);

  function loadQuiz() {
    if (!id) return;
    quizzesApi.getQuestions(id).then((raw: unknown) => {
      const q = raw as Quiz;
      setQuiz(q);
      setQuizForm({
        title: q.title,
        slug: q.slug,
        description: q.description ?? '',
        quizType: q.quizType ?? 'MIXED',
        timeLimitMinutes: q.timeLimitMinutes ?? 0,
        passingScore: q.passingScore ?? 60,
        isPublished: q.isPublished ?? false,
        allowGuest: q.allowGuest ?? false,
        visibleToRoles: (Array.isArray(q.visibleToRoles) ? q.visibleToRoles : []).filter((r: string) => r !== 'ADMIN'),
      });
    }).catch(console.error);
  }

  const mcQuestions = (quiz?.questions ?? []).filter((q) => MC_TYPES.includes(q.type));
  const essayQuestions = (quiz?.questions ?? []).filter((q) => ESSAY_TYPES.includes(q.type));

  function openNewQuestion(type: 'mc' | 'essay') {
    setEditingQ(null);
    setQuestionType(type);
    setQuestionForm({
      questionText: '',
      options: ['', ''],
      correctAnswerIndex: 0,
      correctAnswerText: '',
    });
    setShowQuestionForm(true);
  }

  function openEditQuestion(q: Question) {
    setEditingQ(q);
    setQuestionType(ESSAY_TYPES.includes(q.type) ? 'essay' : 'mc');
    const opts = Array.isArray(q.options) ? [...q.options] : [];
    while (opts.length < 2) opts.push('');
    const correctIndex = opts.findIndex((o) => o === q.correctAnswer);
    setQuestionForm({
      questionText: q.questionText,
      options: opts.slice(0, MAX_OPTIONS),
      correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
      correctAnswerText: ESSAY_TYPES.includes(q.type) ? (q.correctAnswer || '') : '',
    });
    setShowQuestionForm(true);
  }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!id || isNew) return;
    try {
      await quizzesApi.update(id, quizForm);
      loadQuiz();
      show('success', 'Đã lưu cài đặt bài test.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    }
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!id || isNew) return;
    const options = questionForm.options.filter(Boolean);
    const correctAnswer = questionType === 'mc'
      ? (options[questionForm.correctAnswerIndex] ?? options[0] ?? '')
      : questionForm.correctAnswerText;
    const type = questionType === 'mc' ? 'MULTIPLE_CHOICE' : 'ESSAY';
    const payload = {
      type,
      questionText: questionForm.questionText,
      options: questionType === 'mc' ? options : undefined,
      correctAnswer,
    };
    try {
      if (editingQ) {
        await quizzesApi.updateQuestion(editingQ.id, payload);
        show('success', 'Đã sửa câu hỏi.');
      } else {
        await quizzesApi.addQuestion(id, payload);
        show('success', 'Đã thêm câu hỏi.');
      }
      setShowQuestionForm(false);
      loadQuiz();
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Lưu thất bại.');
    }
  }

  async function removeQuestion(questionId: string) {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await quizzesApi.deleteQuestion(questionId);
      loadQuiz();
      show('success', 'Đã xóa câu hỏi.');
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Xóa thất bại.');
    }
  }

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const q = await quizzesApi.create(newQuizForm) as { id: string };
      show('success', 'Đã tạo bài test.');
      navigate(`/quizzes/${q.id}`, { replace: true });
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Tạo thất bại.');
    } finally {
      setCreating(false);
    }
  }

  function addOption() {
    if (questionForm.options.length >= MAX_OPTIONS) return;
    setQuestionForm((f) => ({ ...f, options: [...f.options, ''] }));
  }

  function removeOption(i: number) {
    if (questionForm.options.length <= 2) return;
    const next = questionForm.options.filter((_, j) => j !== i);
    const newCorrect = questionForm.correctAnswerIndex >= next.length ? next.length - 1 : questionForm.correctAnswerIndex;
    setQuestionForm((f) => ({ ...f, options: next, correctAnswerIndex: newCorrect }));
  }

  if (!id) return null;

  if (isNew) {
    return (
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Tạo bài test mới</h1>
        <form onSubmit={createQuiz} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề</label>
            <input
              value={newQuizForm.title}
              onChange={(e) => setNewQuizForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL)</label>
            <input
              value={newQuizForm.slug}
              onChange={(e) => setNewQuizForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loại bài test</label>
            <select
              value={newQuizForm.quizType}
              onChange={(e) => setNewQuizForm((f) => ({ ...f, quizType: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={newQuizForm.description}
              onChange={(e) => setNewQuizForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-gray-900 text-white rounded">
              {creating ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button type="button" onClick={() => navigate('/quizzes')} className="px-4 py-2 border rounded">
              Hủy
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!quiz) return <div className="p-6">Đang tải...</div>;

  const showMC = quizForm.quizType === 'MULTIPLE_CHOICE_ONLY' || quizForm.quizType === 'MIXED';
  const showEssay = quizForm.quizType === 'ESSAY_ONLY' || quizForm.quizType === 'MIXED';

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <button onClick={() => navigate('/quizzes')} className="text-sm text-gray-500 hover:underline mb-1">
            ← Bài test
          </button>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.slug} · {QUIZ_TYPE_LABELS[quizForm.quizType]}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAttempts(true);
            quizzesApi.listAttempts(id).then((r: unknown) => setAttempts(r as { items: unknown[] }));
          }}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
        >
          <ListChecks size={18} />
          Bài nộp
        </button>
      </div>

      <form onSubmit={saveQuiz} className="bg-white rounded-lg shadow p-4 mb-6 space-y-3">
        <h2 className="font-medium">Cài đặt bài test</h2>
        <div>
          <label className="block text-sm mb-1">Loại bài test</label>
          <select
            value={quizForm.quizType}
            onChange={(e) => setQuizForm((f) => ({ ...f, quizType: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Thời gian (phút)</label>
            <input
              type="number"
              min={0}
              value={quizForm.timeLimitMinutes}
              onChange={(e) => setQuizForm((f) => ({ ...f, timeLimitMinutes: Number(e.target.value) }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Điểm đạt (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={quizForm.passingScore}
              onChange={(e) => setQuizForm((f) => ({ ...f, passingScore: Number(e.target.value) }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={quizForm.isPublished}
            onChange={(e) => setQuizForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          <label>Xuất bản (hiện trên website)</label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={quizForm.allowGuest}
            onChange={(e) => setQuizForm((f) => ({ ...f, allowGuest: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <label>Cho phép khách (chưa đăng nhập) xem và làm bài</label>
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Vai trò được xem / làm bài</p>
          <p className="text-xs text-gray-500 mb-2">Để trống = tất cả vai trò.</p>
          <div className="flex flex-wrap gap-4">
            {ROLE_OPTIONS.map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quizForm.visibleToRoles.includes(opt.value)}
                  onChange={(e) => {
                    setQuizForm((f) => ({
                      ...f,
                      visibleToRoles: e.target.checked
                        ? [...f.visibleToRoles, opt.value]
                        : f.visibleToRoles.filter((r) => r !== opt.value),
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded">
          Lưu cài đặt
        </button>
      </form>

      {/* Khối Trắc nghiệm */}
      {showMC && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-3 border-b flex justify-between items-center">
            <h2 className="font-medium">Trắc nghiệm ({mcQuestions.length})</h2>
            <button
              type="button"
              onClick={() => openNewQuestion('mc')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded text-sm"
            >
              <Plus size={16} />
              Thêm câu hỏi
            </button>
          </div>
          <ul className="divide-y">
            {mcQuestions.length === 0 ? (
              <li className="p-4 text-gray-500 text-sm">Chưa có câu trắc nghiệm. Nhấn &quot;Thêm câu hỏi&quot;.</li>
            ) : (
              mcQuestions.map((q) => (
                <li key={q.id} className="p-4">
                  <p className="font-medium text-gray-900 mb-2">{q.questionText}</p>
                  <ul className="space-y-1 mb-3">
                    {(q.options ?? []).map((opt, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs bg-gray-50">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                        {opt === q.correctAnswer && (
                          <span className="text-xs text-green-700 font-medium">(Đáp án đúng)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditQuestion(q)} className="flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100">
                      <Pencil size={14} /> Sửa
                    </button>
                    <button type="button" onClick={() => removeQuestion(q.id)} className="flex items-center gap-1 px-2 py-1 text-sm text-red-700 border border-red-200 rounded hover:bg-red-50">
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Khối Tự luận */}
      {showEssay && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center">
            <h2 className="font-medium">Tự luận ({essayQuestions.length})</h2>
            <button
              type="button"
              onClick={() => openNewQuestion('essay')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded text-sm"
            >
              <Plus size={16} />
              Thêm câu hỏi
            </button>
          </div>
          <ul className="divide-y">
            {essayQuestions.length === 0 ? (
              <li className="p-4 text-gray-500 text-sm">Chưa có câu tự luận. Nhấn &quot;Thêm câu hỏi&quot;.</li>
            ) : (
              essayQuestions.map((q) => (
                <li key={q.id} className="p-4">
                  <p className="font-medium text-gray-900 mb-2">{q.questionText}</p>
                  {q.correctAnswer && (
                    <div className="mb-3 pl-3 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-500 uppercase">Đáp án mẫu / Ghi chú chấm</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{q.correctAnswer}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditQuestion(q)} className="flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100">
                      <Pencil size={14} /> Sửa
                    </button>
                    <button type="button" onClick={() => removeQuestion(q.id)} className="flex items-center gap-1 px-2 py-1 text-sm text-red-700 border border-red-200 rounded hover:bg-red-50">
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Modal thêm/sửa câu hỏi */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingQ ? 'Sửa câu hỏi' : questionType === 'mc' ? 'Thêm câu trắc nghiệm' : 'Thêm câu tự luận'}
            </h3>
            <form onSubmit={saveQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung câu hỏi *</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, questionText: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              {questionType === 'mc' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Các lựa chọn (chọn 1 làm đáp án đúng, tối đa 5)</label>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={questionForm.correctAnswerIndex === i}
                        onChange={() => setQuestionForm((f) => ({ ...f, correctAnswerIndex: i }))}
                        className="shrink-0"
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...questionForm.options];
                          next[i] = e.target.value;
                          setQuestionForm((f) => ({ ...f, options: next }));
                        }}
                        className="flex-1 border rounded px-3 py-2"
                        placeholder={`Lựa chọn ${i + 1}`}
                      />
                      {questionForm.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {questionForm.options.length < MAX_OPTIONS && (
                    <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:underline">
                      + Thêm lựa chọn
                    </button>
                  )}
                </div>
              )}
              {questionType === 'essay' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Đáp án mẫu / Ghi chú chấm (tùy chọn)</label>
                  <textarea
                    value={questionForm.correctAnswerText}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, correctAnswerText: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Giáo viên dùng để tham chiếu khi chấm..."
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded">
                  {editingQ ? 'Cập nhật' : 'Thêm'}
                </button>
                <button type="button" onClick={() => setShowQuestionForm(false)} className="px-4 py-2 border rounded">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal danh sách bài nộp */}
      {showAttempts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Bài nộp</h3>
              <button type="button" onClick={() => setShowAttempts(false)} className="text-gray-500 hover:text-gray-700">
                Đóng
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {attempts?.items?.length === 0 ? (
                <p className="text-gray-500">Chưa có bài nộp.</p>
              ) : (
                <ul className="space-y-2">
                  {(attempts?.items ?? []).map((a: any) => (
                    <li key={a.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{a.guestName || (a.user ? `${a.user.firstName} ${a.user.lastName}` : '—')}</p>
                        <p className="text-sm text-gray-500">{a.guestEmail || a.user?.email} · {a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN') : ''}</p>
                        <p className="text-sm">Điểm: {a.score != null ? `${a.score}%` : 'Chờ chấm'}</p>
                      </div>
                      <Link to={`/quizzes/attempt/${a.id}`} className="text-blue-600 hover:underline text-sm">
                        Xem & chấm
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
