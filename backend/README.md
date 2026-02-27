# Chinese Center – Backend API

NestJS + Prisma, API chung cho **website** và **CRM**.

## Yêu cầu

- Node 18+
- PostgreSQL

## Cài đặt

```bash
npm install
cp .env.example .env
# Sửa .env: DATABASE_URL, JWT_SECRET
```

## Database

```bash
npx prisma db push
# hoặc
npx prisma migrate dev --name init

npm run db:seed
```

Seed tạo user admin: `admin@chinese-center.local` / `admin123`.

## Chạy

```bash
npm run dev
```

API: `http://localhost:4000/api/v1`

## Endpoint chính

| Nhóm | Mô tả |
|------|--------|
| `POST /auth/login` | Đăng nhập (email, password) → JWT |
| `GET /auth/me` | Thông tin user (Bearer) |
| `GET /posts` | Danh sách bài viết (public, published) |
| `GET /posts/by-slug/:slug` | Chi tiết bài viết theo slug |
| `GET /posts/crm/list` | CRM: danh sách có lọc status (cần JWT + Admin/Teacher) |
| `POST|PUT|DELETE /posts` | CRM: tạo/sửa/xóa bài viết |
| `GET /courses`, `GET /courses/:id` | Khóa học |
| `GET /lessons/course/:courseId` | Bài học theo khóa |
| `POST|PUT|DELETE /lessons` | CRM: quản lý bài học |
| `GET /quizzes`, `GET /quizzes/:id` | Bài test |
| `POST /quizzes/:id/attempt` | Nộp bài (cần JWT) |
| `POST|PUT|DELETE /quizzes`, `.../questions` | CRM: quản lý quiz và câu hỏi |
| `POST /mail/send` | CRM: gửi email (cần JWT + Admin/Teacher) |
| `POST /mail/check` | Kiểm tra SMTP đã cấu hình |
| `POST /leads` | Website gửi form Liên hệ / Đăng ký học thử (public). Lưu DB + gửi email về `LEAD_OWNER_EMAIL`. |
| `GET /leads` | CRM: danh sách lead (JWT + Admin/Teacher), query `?type=TU_VAN` hoặc `DANG_KY_HOC_THU`. |

**Bài test:** Mỗi quiz có `quizType`: `MULTIPLE_CHOICE_ONLY` (chỉ trắc nghiệm), `ESSAY_ONLY` (chỉ tự luận), `MIXED` (hỗn hợp). Câu hỏi có type: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY.

**Mail:** Cấu hình SMTP trong `.env` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Nếu không cấu hình, `POST /mail/send` trả về lỗi.

Chi tiết data model: xem `docs/backend-crm-design.md`.
