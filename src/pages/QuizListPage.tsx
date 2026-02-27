import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import { quizzesApi, type QuizListItem } from '@/lib/api';
import { ClipboardList, Clock, Target } from 'lucide-react';

const QUIZ_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE_ONLY: 'Trắc nghiệm',
  ESSAY_ONLY: 'Tự luận',
  MIXED: 'Trắc nghiệm + Tự luận',
};

export default function QuizListPage() {
  const [items, setItems] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    quizzesApi
      .listPublished()
      .then((res) => setItems(res.items))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Không tải được danh sách bài kiểm tra.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Bài kiểm tra" />
      <section className="section-padding">
        <div className="container-wide">
          <SectionTitle
            overline="Bài kiểm tra"
            title="Kiểm tra khả năng của bạn"
            subtitle="Chọn một bài kiểm tra bên dưới để làm bài. Kết quả trắc nghiệm được chấm tự động; phần tự luận sẽ do giáo viên chấm."
          />

          {loading && <p className="mt-8 text-center text-primary-600">Đang tải...</p>}
          {error && <p className="mt-8 text-center text-red-600">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="mt-8 text-center text-primary-600">Chưa có bài kiểm tra nào được hiển thị.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((quiz) => (
                <article
                  key={quiz.id}
                  className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <h2 className="text-lg font-semibold text-primary-900 mb-2 line-clamp-2">{quiz.title}</h2>
                  {quiz.description && (
                    <p className="text-sm text-primary-600 mb-4 line-clamp-3 flex-1">{quiz.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-primary-500 mb-4">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      {quiz._count.questions} câu
                    </span>
                    {quiz.timeLimitMinutes != null && quiz.timeLimitMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.timeLimitMinutes} phút
                      </span>
                    )}
                    {quiz.passingScore != null && (
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Đạt {quiz.passingScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary-500 mb-4">
                    {QUIZ_TYPE_LABELS[quiz.quizType] || quiz.quizType}
                  </p>
                  <Link to={`/bai-test/${quiz.slug}`} className="mt-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Làm bài kiểm tra
                    </Button>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
