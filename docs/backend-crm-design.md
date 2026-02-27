# Thiết kế Backend & CRM – Liên kết với Website

## 1. Node.js vs Go: Gợi ý lựa chọn

| Tiêu chí | Node.js (NestJS/Express) | Go (Gin/Fiber/Echo) |
|----------|---------------------------|----------------------|
| **Tốc độ phát triển** | Nhanh, ecosystem npm, TypeScript | Chậm hơn, ít thư viện sẵn (ORM, auth) |
| **Performance** | Đủ tốt cho CRM/edu, I/O bound | Cao hơn, phù hợp high throughput |
| **Team / Tuyển dụng** | Dễ tìm dev JS/TS | Ít hơn, cần chuyên Go |
| **Codebase hiện tại** | **Đã có frontend React** – cùng ngôn ngữ, share type/validation | Phải viết lại API, khác ngôn ngữ |
| **ORM / DB** | Prisma, TypeORM rất mạnh | GORM tốt nhưng ít tiện bằng Prisma |
| **Auth / JWT** | Passport, NestJS guard sẵn | Tự tích hợp hoặc lib bên thứ 3 |
| **Mở rộng sau** | Dễ tách microservice từ monolith | Từ đầu đã hướng service nhỏ |

**Đề xuất:** Giữ **Node.js (NestJS)** cho backend vì:
- Đồng bộ với stack hiện tại (React, TypeScript), dễ share type và logic.
- Prisma + NestJS phù hợp CRM (CRUD phức tạp, quan hệ Course → Lesson → Test).
- Thời gian đưa tính năng (bài viết, bài học, bài test) lên nhanh hơn so với viết mới bằng Go.

Go nên cân nhắc khi: scale rất lớn, team có sẵn Go, hoặc tách service tính toán/background sang Go sau.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Website       │     │   Backend API   │     │   CRM (Admin)   │
│   (React/Vite)  │────▶│   (NestJS)      │◀────│   (React/Vite)  │
│   Public        │     │   REST + Auth   │     │   Nội bộ        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   + Redis       │
                        └─────────────────┘
```

- **Backend (NestJS):** Một API duy nhất phục vụ cả website lẫn CRM.
- **Website (source hiện tại):** Gọi API đọc bài viết, khóa học, bài học, làm bài test (public).
- **CRM:** Đăng nhập (role Admin/Teacher), gọi cùng API để: nhập/sửa bài viết, khóa học, bài học, nội dung, bài test.

---

## 3. Data model mở rộng (Backend)

### 3.1. Bài viết (Blog)

- **Post:** id, title, slug, excerpt, body (HTML/Markdown), coverImage, authorId, status (DRAFT/PUBLISHED), publishedAt, createdAt, updatedAt.
- Dùng cho trang Tin tức trên website; CRM có màn nhập/sửa bài viết.

### 3.2. Khóa học & Bài học

- **Course** (đã có): giữ nguyên, bổ sung quan hệ với Lesson.
- **Lesson:** id, courseId, title, slug, orderIndex, content (rich text), durationMinutes, type (VIDEO/DOCUMENT/QUIZ), videoUrl, createdAt, updatedAt.
- Một Course có nhiều Lesson (1–n). Trên website: khóa → danh sách bài học; CRM: thêm/sửa/xóa bài học, kéo thứ tự.

### 3.3. Bài test (Quiz)

- **Quiz:** id, title, slug, description, courseId (nullable), lessonId (nullable), timeLimitMinutes, passingScore, isPublished, createdAt, updatedAt.
- **QuizQuestion:** id, quizId, type (MULTIPLE_CHOICE/TRUE_FALSE/TEXT), questionText, options (JSON), correctAnswer, orderIndex.
- **QuizAttempt:** id, userId, quizId, score, answers (JSON), startedAt, submittedAt (để chấm và lưu lịch sử).
- Website: hiển thị bài test trong khóa/bài học hoặc trang riêng; CRM: tạo/sửa quiz và câu hỏi.

### 3.4. Liên kết với frontend hiện tại

- **Website:**
  - Tin tức: `GET /api/v1/posts` (public), `GET /api/v1/posts/:slug`.
  - Khóa học: `GET /api/v1/courses`, `GET /api/v1/courses/:id/lessons`.
  - Bài học: `GET /api/v1/lessons/:id` (có thể check enrollment).
  - Bài test: `GET /api/v1/quizzes/:id`, `POST /api/v1/quizzes/:id/attempt`.
- **CRM:** Cùng base URL, thêm prefix hoặc subdomain (vd: `crm.domain.com`), dùng JWT role Admin/Teacher; các endpoint `POST/PUT/DELETE` cho posts, courses, lessons, quizzes.

---

## 4. CRM – Chức năng cần có

| Module | Chức năng | API (Backend) |
|--------|-----------|----------------|
| **Đăng nhập** | Login với tài khoản Admin/Teacher | `POST /auth/login`, JWT |
| **Bài viết** | Danh sách, tạo, sửa, xóa, đổi status (draft/published) | CRUD `/posts` |
| **Khóa học** | Danh sách, tạo, sửa, xóa; quản lý bài học con | CRUD `/courses`, `/courses/:id/lessons` |
| **Bài học** | Thêm/sửa/xóa lesson trong khóa; nội dung rich text, video, thứ tự | CRUD `/lessons` |
| **Bài test** | Tạo/sửa quiz; thêm/sửa/xóa câu hỏi; cài thời gian, điểm đạt | CRUD `/quizzes`, `/quizzes/:id/questions` |
| **Content** | Nội dung bài học (HTML/MD) nhập trong editor (CRM) | Lưu trong `Lesson.content` |

---

## 5. Cấu trúc repo đề xuất

```
Chinese-center/
├── backend/          # NestJS + Prisma (API chung cho web + CRM)
├── frontend/         # Website công khai (source hiện tại)
├── crm/              # React admin (bài viết, khóa học, bài học, bài test)
└── docs/             # Tài liệu (file này + api-reference, deployment)
```

- **Backend:** Chạy một lần, expose API; cả `frontend` và `crm` đều gọi tới đây.
- **Frontend:** Chỉ đọc dữ liệu (posts, courses, lessons, quizzes) + gửi attempt khi user làm test.
- **CRM:** Đọc/ghi đầy đủ sau khi đăng nhập; có thể deploy cùng domain (vd. `/crm`) hoặc subdomain.

---

## 6. Bước triển khai đề xuất

1. **Backend:** Thêm Prisma model (Post, Lesson, Quiz, QuizQuestion, QuizAttempt) và module NestJS tương ứng (Posts, Lessons, Quizzes); bổ sung endpoint public + guard role cho CRM.
2. **CRM:** Tạo app React (Vite) với router, login, layout sidebar; các trang: Posts, Courses (và Lessons), Quizzes (và Questions); form nhập rich text (Tiptap hoặc tương đương).
3. **Frontend (website):** Đổi dữ liệu tĩnh sang gọi API (posts, courses, lessons, quizzes); trang bài test gọi `POST /quizzes/:id/attempt` và hiển thị kết quả.

**Đã triển khai:** Backend (NestJS + Prisma) trong `backend/`, CRM (React/Vite) trong `crm/`. Chạy backend: `cd backend && npm run dev`. Seed admin: `admin@chinese-center.local` / `admin123`. CRM: `cd crm && npm run dev` (port 5174), cấu hình `VITE_API_URL` trong `.env`. Tiếp theo: kết nối website (frontend) với API và triển khai.
