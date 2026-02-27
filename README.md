# Chinese Center – Website (Vite + React + Tailwind)

Giao diện website trung tâm tiếng Trung: React 18, Vite 5, TailwindCSS 3, Framer Motion.  
Thiết kế hướng tới UX/UI chuyên nghiệp, dễ mở rộng cho CRM (bài kiểm tra, khóa học) sau này.

## Tech stack

- **React 18** + **TypeScript**
- **Vite 5** – build nhanh, HMR
- **TailwindCSS 3** – utility-first CSS
- **React Router 6** – routing
- **Framer Motion** – animation nhẹ
- **Lucide React** – icon

## Chạy dự án

```bash
# Cài dependency
npm install

# Dev (http://localhost:3000)
npm run dev

# Build production
npm run build

# Preview build
npm preview
```

## Cấu trúc thư mục

```
src/
├── components/
│   ├── layout/       # Navbar, Footer, Layout
│   ├── ui/           # Button, SectionTitle
│   ├── home/         # Hero, StatsBar, WhyUs, CoursePreview, TeachersPreview, Testimonials, CtaSection
│   ├── courses/      # CourseCard
│   └── teachers/     # TeacherCard
├── pages/            # HomePage, CoursesPage, TeachersPage, ContactPage, AboutPage
├── lib/              # utils (cn, formatCurrency)
├── App.tsx
├── main.tsx
└── index.css
```

## Design system

- **Màu chủ đạo**: Đen – Vàng – Trắng
  - **primary** (đen): `primary-900`, `primary-950` cho chữ, nền footer/CTA, nút đen
  - **accent** (vàng): `accent-500`, `accent-600` cho CTA, link hover, overline, số liệu, logo 中文
  - **Trắng**: nền trang, card; chữ trắng trên nền đen
- **Khoảng cách chuẩn**:
  - Section: `.section-padding` (py 4rem mobile, 5rem desktop; px 4/6/8)
  - Container: `.container-wide` (max-w-6xl), `.container-narrow` (max-w-3xl)
  - Card: `p-5 sm:p-6` hoặc `p-6 sm:p-8`
  - Gap giữa block: `gap-5 sm:gap-6 lg:gap-8` hoặc `gap-6 sm:gap-8`
- **Chữ**: Inter (Latin), Noto Sans SC (tiếng Trung)
- **Nút**: primary = đen, secondary = vàng, outline = viền đen

## Trang & chức năng

| Trang / Chức năng   | Path                    | Mô tả |
|---------------------|-------------------------|--------|
| Trang chủ           | `/`                     | Hero, stats, khuyến mãi, WhyUs, khóa học, giáo viên, testimonial, CTA |
| Khóa học            | `/khoa-hoc`             | Danh sách khóa, filter theo level |
| Đội ngũ giáo viên   | `/doi-ngu-giao-vien`    | Danh sách giáo viên |
| Kiểm tra trình độ   | `/kiem-tra-trinh-do`    | Quiz gợi ý khóa HSK phù hợp |
| Đăng ký học thử     | `/dang-ky-hoc-thu`      | Form đặt lịch học thử (khóa, khung giờ) |
| Lịch học            | `/lich-hoc`             | Bảng lịch học mẫu các khóa |
| FAQ                 | `/cau-hoi-thuong-gap`   | Accordion câu hỏi thường gặp |
| Tin tức             | `/tin-tuc`              | Danh sách bài viết |
| Bài viết             | `/tin-tuc/:slug`        | Chi tiết bài viết |
| Về chúng tôi        | `/ve-chung-toi`         | Giới thiệu, sứ mệnh |
| Liên hệ             | `/lien-he`              | Form + thông tin liên hệ |
| **Tìm kiếm**        | (icon kính lúp Navbar)  | Modal tìm khóa học theo từ khóa |
| **Sticky contact**   | (góc phải màn hình)    | Nút Gọi điện + Chat Zalo cố định |

## Responsive & tương thích thiết bị

- **Breakpoints**: Mobile first (mặc định), `sm:640px`, `md:768px`, `lg:1024px`.
- **Touch**: Nút/input quan trọng có `min-h-[44px]` (khuyến nghị Apple/Google), `touch-manipulation` giảm delay double-tap.
- **Viewport**: `viewport-fit=cover` + `theme-color` cho mobile; safe-area cho máy có notch.
- **Tràn ngang**: `overflow-x-hidden` trên body, bảng Lịch học có `overflow-x-auto` trên mobile.

## Kết nối API (CRM sau này)

- Cấu hình proxy trong `vite.config.ts`: `/api` → backend.
- Có thể thêm React Query + axios trong `src/lib/api.ts` để gọi API backend (courses, teachers, enrollments).
- Cấu trúc component và trang hiện tại dễ gắn data từ API và thêm trang quản lý (admin), bài kiểm tra, khóa học chi tiết.

## Môi trường

Tạo file `.env` (xem `.env.example` nếu có):

- `VITE_API_URL=http://localhost:4000` – dùng khi gọi API từ frontend.
