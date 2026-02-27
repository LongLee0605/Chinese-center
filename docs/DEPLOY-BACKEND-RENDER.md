# Deploy Backend lên Render (Free) – Từng bước

Backend NestJS + PostgreSQL chạy trên Render free tier. Làm lần lượt các bước dưới.

---

## Bước 1: Đẩy code lên GitHub

1. Mở terminal tại thư mục gốc dự án (Chinese-center).
2. Nếu chưa có remote:
   ```bash
   git remote add origin https://github.com/<username>/<repo>.git
   ```
3. Đẩy toàn bộ code:
   ```bash
   git add .
   git commit -m "Prepare backend for Render deploy"
   git push -u origin main
   ```
   (Nếu nhánh chính là `master` thì dùng `master` thay cho `main`.)

---

## Bước 2: Tạo tài khoản Render

1. Vào https://render.com → **Get Started**.
2. Đăng ký bằng **GitHub** (nên dùng để Render tự kết nối repo).

---

## Bước 3: Tạo PostgreSQL (Free)

1. Trên Dashboard Render → **New +** → **PostgreSQL**.
2. Điền:
   - **Name**: `chinese-center-db` (tùy chọn).
   - **Region**: chọn gần VN (Singapore).
   - **Plan**: **Free**.
3. Bấm **Create Database**.
4. Đợi vài phút, khi trạng thái **Available**:
   - Vào tab **Info**.
   - Copy **Internal Database URL** (dùng cho Web Service trên cùng Render).
   - Hoặc **External Database URL** (nếu sau này chạy thêm service ngoài Render).

Lưu lại URL dạng:
`postgresql://user:pass@host/dbname?sslmode=require`

---

## Bước 4: Tạo Web Service (Backend)

1. **New +** → **Web Service**.
2. **Connect repository**:
   - Chọn GitHub, authorize nếu cần.
   - Chọn repo chứa code (Chinese-center).
   - Bấm **Connect**.
3. Cấu hình:
   - **Name**: `chinese-center-api` (tùy chọn).
   - **Region**: cùng region với DB (vd: Singapore).
   - **Branch**: `main` (hoặc `master`).
   - **Root Directory**: `backend`  
     → Quan trọng: Render sẽ chạy `npm install` và `npm run build` trong thư mục `backend`.
   - **Runtime**: **Node**.
   - **Build Command**:  
     `npm install && npm run build`  
     (trong `backend` đã có script `build` = `prisma generate && nest build`).
   - **Start Command**:  
     `npm run start:prod`
   - **Plan**: **Free**.

4. **Environment Variables** (bấm **Advanced** hoặc kéo xuống mục Environment):
   Thêm lần lượt:

   | Key             | Value |
   |-----------------|--------|
   | `NODE_ENV`      | `production` |
   | `DATABASE_URL`  | Dán **Internal Database URL** từ Bước 3 (từ Postgres → Info). |
   | `JWT_SECRET`    | Một chuỗi bí mật dài, random (vd: tạo bằng `openssl rand -base64 32`). |
   | `JWT_EXPIRES_IN`| `7d` |
   | `CORS_ORIGINS`  | URL website + CRM, cách nhau dấu phẩy, không dấu cách. Ví dụ: `https://ten-website.vercel.app,https://crm.vercel.app` (sau khi deploy FE bạn sẽ cập nhật lại). Tạm có thể để `*` để test: `*` |

   **Lưu ý**: Không set `PORT`. Render tự gán biến `PORT`; backend đã dùng `process.env.PORT || 4000`.

5. Bấm **Create Web Service**.

---

## Bước 5: Đồng bộ schema database (Prisma)

Sau lần deploy đầu tiên, cần chạy Prisma để tạo bảng trong Postgres.

1. Trên Render Dashboard → chọn **Web Service** vừa tạo.
2. Tab **Shell** (hoặc **Logs** nếu không thấy Shell).
3. Nếu có **Shell**:
   - Chọn **Connect** để mở shell trong môi trường của service (đã có `DATABASE_URL`).
   - Chạy:
     ```bash
     npx prisma db push
     ```
   - Thoát shell.
4. Nếu **không có Shell** (free tier có thể ẩn):
   - Trên máy local, tạo file `.env.render` (không commit) và dán **External Database URL** vào:
     ```env
     DATABASE_URL="postgresql://..."
     ```
   - Trong thư mục `backend`:
     ```bash
     cd backend
     set DATABASE_URL=<dán External Database URL>
     npx prisma db push
     ```
     (Trên Windows PowerShell: `$env:DATABASE_URL="postgresql://..."` rồi chạy `npx prisma db push`.)

Sau bước này, DB đã có đủ bảng. Nếu cần tạo user CRM ban đầu, chạy seed (xem Bước 7).

---

## Bước 6: Kiểm tra API và Health

1. Trên trang Web Service, copy **URL** (vd: `https://chinese-center-api.onrender.com`).
2. Mở trình duyệt:
   - Health: `https://chinese-center-api.onrender.com/api/v1/health`  
     → Trả về JSON `{ "ok": true, "timestamp": "..." }`.
   - Base API: `https://chinese-center-api.onrender.com/api/v1/`  
     → Có thể trả 404 hoặc thông báo tùy Nest, miễn health OK là được.

3. **Lưu URL gốc** (không có `/api/v1`) để dùng cho Frontend:
   - **VITE_API_URL** = `https://chinese-center-api.onrender.com/api/v1`  
   (Website và CRM đều set biến này khi deploy Vercel.)

---

## Bước 7: (Tùy chọn) Seed user CRM lần đầu

Nếu bạn dùng seed để tạo admin/teacher:

1. Trên Render Shell (hoặc local với `DATABASE_URL` trỏ DB Render):
   ```bash
   cd backend
   npm run db:seed
   ```
2. Nếu seed chạy trên máy local: đảm bảo `.env` hoặc biến môi trường có `DATABASE_URL` = **External Database URL** của Render (và DB cho phép kết nối từ ngoài).

---

## Tóm tắt biến môi trường Render (Backend)

| Key             | Bắt buộc | Ghi chú |
|-----------------|----------|--------|
| `NODE_ENV`      | Có       | `production` |
| `DATABASE_URL`  | Có       | Internal URL từ Postgres service |
| `JWT_SECRET`    | Có       | Chuỗi bí mật mạnh |
| `JWT_EXPIRES_IN` | Không  | Mặc định `7d` |
| `CORS_ORIGINS`  | Có       | URL FE (Vercel) cách nhau dấu phẩy, hoặc `*` tạm thời |
| `PORT`          | Không    | Render tự set |

---

## Lưu ý Free tier

- **Sleep**: Sau ~15 phút không có request, service sẽ ngủ. Request đầu tiên sau đó có thể chậm 30s–1 phút (cold start).
- **Giới hạn**: RAM/CPU giới hạn; phù hợp demo / vài trăm user. Khi cần ổn định hơn, có thể nâng lên plan trả phí.

Sau khi backend chạy ổn, có thể deploy **Website** và **CRM** lên Vercel và set `VITE_API_URL` trỏ đúng URL trên.
