# Cấu trúc source – Phân tách Frontend & Backend

Dự án gồm **3 ứng dụng độc lập**, có thể chạy và deploy riêng biệt.

---

## 1. Cấu trúc thư mục

| Thư mục / File gốc | Ứng dụng | Mô tả |
|-------------------|----------|--------|
| **`backend/`** | API (NestJS) | Backend duy nhất: Auth, Posts, Courses, Lessons, Quizzes, Leads, Mail, **Teachers**. Chạy độc lập, expose API tại `http://localhost:4000/api/v1`. |
| **Gốc repo** (`/`) | Website (Vite + React) | Website công khai: trang chủ, khóa học, giáo viên, tin tức, liên hệ, đăng ký học thử. Build ra static, gọi API backend. |
| **`crm/`** | CRM (Vite + React) | Ứng dụng quản trị: đăng nhập, quản lý bài viết, khóa học, bài test, **đội ngũ giáo viên**, leads, gửi mail. Build ra static, gọi API backend. |

- **Backend** và **Frontend (Web + CRM)** không share code, chỉ giao tiếp qua HTTP API.
- Có thể deploy Backend lên một server (Node), Web và CRM lên CDN / static host khác, chỉ cần cấu hình CORS và `VITE_API_URL` / proxy.

---

## 2. Chạy từng phần (development)

### Backend (bắt buộc chạy trước)

```bash
cd backend
npm install
# Cấu hình .env (DATABASE_URL, JWT_SECRET, ...)
npm run db:push
npm run db:seed   # tùy chọn
npm run dev      # http://localhost:4000
```

### Website (gốc repo)

```bash
# Tại thư mục gốc Chinese-center
npm install
npm run dev      # http://localhost:3000, proxy /api và /uploads → backend
```

### CRM

```bash
cd crm
npm install
# Cấu hình crm/.env: VITE_API_URL=http://localhost:4000/api/v1
npm run dev      # http://localhost:5174 hoặc port khác
```

---

## 3. Deploy tách biệt FE & BE

### Backend

- Chạy trên server (Node/PM2/Docker): `npm run build` rồi `node dist/main` (hoặc `npm run start:prod`).
- Cấu hình: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` (thêm domain frontend), SMTP/Lead nếu dùng.
- Ảnh upload (giáo viên): thư mục `backend/uploads/` cần được serve static tại `/uploads` (đã cấu hình trong `main.ts`). Khi deploy, dùng reverse proxy (Nginx) serve `/uploads` từ thư mục đó hoặc copy lên CDN.

### Website (frontend công khai)

- Build: tại thư mục gốc `npm run build` → output `dist/`.
- Host `dist/` lên bất kỳ static host nào (Vercel, Netlify, Nginx, S3+CloudFront).
- Biến môi trường build: `VITE_API_URL=https://api.yourdomain.com/api/v1` (trỏ tới backend thật). Nếu API cùng origin thì có thể để trống và dùng relative `/api`.
- Ảnh giáo viên: dùng `VITE_API_URL` để suy ra base URL upload (hoặc set `VITE_UPLOADS_BASE` nếu thêm sau). Proxy hoặc CORS cho `/uploads` nếu API khác domain.

### CRM (frontend quản trị)

- Build: `cd crm && npm run build` → output `crm/dist/`.
- Host `crm/dist/` tương tự static host.
- Biến môi trường build: `VITE_API_URL=https://api.yourdomain.com/api/v1`.

---

## 4. Quy ước code (conventions)

- **Website:** path alias `@/*` → `src/*`; lib trong `src/lib`, barrel `@/lib`.
- **CRM:** path alias `@/*` → `src/*`; API `src/api/client.ts`, utils `src/lib/utils.ts` (cn, errorMessage).
- **Backend:** NestJS strict, path `@/*`; module theo domain, DTO + class-validator.
- **Catch:** dùng `unknown`, kiểm tra `err instanceof Error` khi lấy message.

## 5. Tóm tắt

- **Backend** = một ứng dụng độc lập trong `backend/`.
- **Website** = ứng dụng ở thư mục gốc; **CRM** = ứng dụng trong `crm/`.
- Có thể tách repo sau: copy `backend/` sang repo “chinese-center-api”, copy gốc và `crm/` sang từng repo frontend, chỉ cần đổi `VITE_API_URL` và CORS cho đúng.
