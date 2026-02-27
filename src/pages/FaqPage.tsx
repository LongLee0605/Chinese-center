import Breadcrumb from '@/components/layout/Breadcrumb';
import SectionTitle from '@/components/ui/SectionTitle';
import Accordion from '@/components/ui/Accordion';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'Học phí và hình thức thanh toán như thế nào?',
    answer: 'Học phí từng khóa được niêm yết trên trang Khóa học. Bạn có thể thanh toán chuyển khoản hoặc tiền mặt tại trung tâm. Trung tâm hỗ trợ đóng theo từng cấp độ hoặc trọn khóa, tùy khóa học.',
  },
  {
    id: '2',
    question: 'Tôi chưa biết gì tiếng Trung, nên bắt đầu từ đâu?',
    answer: 'Bạn nên bắt đầu với khóa HSK 1 - Nhập môn. Ngoài ra bạn có thể làm bài Kiểm tra trình độ trên website để được gợi ý khóa phù hợp, hoặc đăng ký học thử 1 buổi miễn phí để trải nghiệm.',
  },
  {
    id: '3',
    question: 'Lớp học có bao nhiêu học viên?',
    answer: 'Mỗi lớp tối đa 15 học viên để đảm bảo giáo viên theo sát và tương tác tốt. Một số khóa luyện thi hoặc giao tiếp có thể giới hạn 10 học viên.',
  },
  {
    id: '4',
    question: 'Có được học bù hoặc chuyển lớp không?',
    answer: 'Có. Học viên báo trước khi vắng sẽ được sắp xếp học bù trong cùng khóa. Trường hợp cần chuyển lớp (đổi lịch), trung tâm sẽ hỗ trợ nếu còn chỗ trống.',
  },
  {
    id: '5',
    question: 'Giáo viên là người Việt hay người Trung Quốc?',
    answer: 'Trung tâm có cả giáo viên người Việt (cử nhân/ thạc sĩ tiếng Trung, chứng chỉ HSK6) và giáo viên bản ngữ. Tùy khóa học sẽ kết hợp để tối ưu phát âm và ngữ pháp.',
  },
  {
    id: '6',
    question: 'Có khóa học online không?',
    answer: 'Hiện tại trung tâm tổ chức học trực tiếp tại cơ sở. Khóa học online đang trong kế hoạch phát triển, bạn có thể để lại thông tin để nhận thông báo khi có lớp.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-primary-50">
      <Breadcrumb currentLabel="Câu hỏi thường gặp" />
      <section className="section-padding">
        <div className="container-narrow">
          <SectionTitle
            overline="Hỗ trợ"
            title="Câu hỏi thường gặp"
            subtitle="Tổng hợp các câu hỏi phổ biến về khóa học, học phí và quy định. Nếu cần thêm thông tin, vui lòng liên hệ hotline hoặc form Liên hệ."
          />
          <div className="mt-10">
            <Accordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
    </div>
  );
}
