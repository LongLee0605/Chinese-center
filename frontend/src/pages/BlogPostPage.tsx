import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';

const POSTS: Record<string, { title: string; date: string; content: string }> = {
  'cach-hoc-tieng-trung-hieu-qua': {
    title: '5 cách học tiếng Trung hiệu quả cho người mới',
    date: '2024-01-15',
    content: 'Học tiếng Trung không khó nếu bạn có phương pháp. Bài viết gợi ý 5 cách: (1) Học phát âm và thanh điệu ngay từ đầu, (2) Học chữ Hán theo bộ thủ và từ vựng theo chủ đề, (3) Luyện nghe – nói mỗi ngày dù chỉ 15 phút, (4) Xem phim/ nghe nhạc tiếng Trung có phụ đề, (5) Tìm bạn hoặc lớp học để thực hành giao tiếp. Chinese Center thiết kế khóa HSK 1 với lộ trình rõ ràng và giáo viên hỗ trợ sát sao, phù hợp người mới bắt đầu.',
  },
  'luyen-thi-hsk-tips': {
    title: 'Bí quyết luyện thi HSK đạt điểm cao',
    date: '2024-01-10',
    content: 'Để đạt điểm HSK tốt, cần nắm cấu trúc đề, ôn đủ từ vựng và ngữ pháp theo từng cấp, đồng thời luyện kỹ năng nghe – đọc – viết. Nên làm đề mẫu và canh thời gian; với HSK 3 trở lên cần luyện viết đoạn văn. Trung tâm có các khóa luyện thi HSK với giáo viên giàu kinh nghiệm và tài liệu cập nhật.',
  },
  'van-hoa-trung-hoa': {
    title: 'Tìm hiểu văn hóa Trung Hoa qua ngôn ngữ',
    date: '2024-01-05',
    content: 'Tiếng Trung gắn chặt với văn hóa: thành ngữ (成语), tục ngữ và cách xưng hô phản ánh lịch sử và quan niệm. Học qua văn hóa giúp nhớ lâu và dùng đúng ngữ cảnh. Tại Chinese Center, các buổi ngoại khóa và chủ đề trong bài học được lồng ghép văn hóa Trung Hoa để học viên vừa giỏi ngôn ngữ vừa hiểu văn hóa.',
  },
  'tieng-trung-thieu-nhi': {
    title: 'Nên cho con học tiếng Trung từ độ tuổi nào?',
    date: '2023-12-28',
    content: 'Độ tuổi 6–12 là giai đoạn trẻ tiếp thu ngôn ngữ mới rất tốt. Khóa Tiếng Trung thiếu nhi tại Chinese Center được thiết kế vui học qua hình ảnh, bài hát và hoạt động nhóm, giúp trẻ làm quen phát âm và từ vựng cơ bản mà không áp lực. Phụ huynh có thể đăng ký học thử để con trải nghiệm.',
  },
};

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? POSTS[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-primary-50 section-padding">
        <div className="container-narrow text-center">
          <p className="text-primary-600">Không tìm thấy bài viết.</p>
          <Link to="/tin-tuc" className="mt-4 inline-block text-accent-600 font-medium">← Về tin tức</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel={post.title} />
      <article className="section-padding">
        <div className="container-narrow">
          <Link to="/tin-tuc" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-accent-600 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Về tin tức
          </Link>
          <header className="mb-8">
            <p className="flex items-center gap-2 text-primary-500 text-sm mb-2">
              <Calendar className="h-4 w-4" />
              {post.date}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">{post.title}</h1>
          </header>
          <div className="prose prose-slate max-w-none text-primary-700 leading-relaxed">
            <p>{post.content}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
