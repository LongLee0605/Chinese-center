# Deploy Backend lên Render (Free) – Từng bước

Backend NestJS + PostgreSQL chạy trên Render free tier. Làm lần lượt các bước dưới.

---

## Có cần tách BE / CRM / Frontend ra repo riêng không?

**Không.** Chỉ cần đẩy **toàn bộ source** (1 repo: backend + crm + website) lên GitHub. Render và Vercel/Netlify hỗ trợ **monorepo**: mỗi service/project chỉ cần chỉ định **Root Directory**:

- **Render (Backend)**: Root Directory = `backend` → build/start chạy trong thư mục `backend`.
- **Vercel – Website**: Root Directory = thư mục gốc (nơi có `package.json` + `src/` của website).
- **Vercel – CRM**: Root Directory = `crm`.

Một repo, nhiều deployment — không cần tách code.

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

   **Gửi email từ CRM (tùy chọn):** Nếu muốn dùng chức năng **Gửi email** trong CRM và nhận thông báo khi có đăng ký từ website, thêm các biến sau (nếu không thêm, CRM sẽ báo "SMTP chưa cấu hình" và không gửi được mail):

   | Key | Value |
   |-----|--------|
   | `SMTP_HOST` | Host SMTP (vd: `smtp.gmail.com`) |
   | `SMTP_PORT` | `587` (TLS) hoặc `465` (SSL) |
   | `SMTP_USER` | Email đăng nhập SMTP |
   | `SMTP_PASS` | Mật khẩu ứng dụng / mật khẩu SMTP |
   | `SMTP_FROM` | (Tùy chọn) Địa chỉ hiển thị người gửi |
   | `LEAD_OWNER_EMAIL` | (Tùy chọn) Email nhận thông báo khi có lead từ form website |

   Sau khi thêm hoặc sửa Environment Variables, bấm **Save** và chờ Render **redeploy** (hoặc **Manual Deploy**) thì backend mới đọc biến mới.

5. Bấm **Create Web Service**.

---

## Xử lý lỗi gửi email (production)

- **Form website (Liên hệ / Đăng ký học thử) báo lỗi hoặc không gửi được**
  - **CORS**: Đảm bảo `CORS_ORIGINS` trên Render có **đúng origin** của website (vd: `https://chinese-center-web.pages.dev` hoặc domain tùy chỉnh). Nhiều origin cách nhau bằng dấu phẩy, không dấu cách thừa.
  - **API URL**: Website production phải gọi đúng backend (build với `VITE_API_URL=https://...onrender.com/api/v1` hoặc set khi build trên Cloudflare/Vercel).
- **Lead lưu được nhưng không nhận được email thông báo**
  - Kiểm tra đã thêm đủ biến SMTP và `LEAD_OWNER_EMAIL` trên Render (Environment).
  - Vào Render → Web Service → **Logs**. Tìm dòng `[Leads] Gửi email thất bại:` hoặc `[Leads] Lỗi khi gửi email` để xem lý do (vd: Gmail báo "Invalid login" → dùng App Password).
- **CRM gửi email thất bại**
  - Trong CRM: **Mail → Kiểm tra SMTP**. Nếu báo "Chưa cấu hình" thì backend chưa có SMTP_HOST / SMTP_USER / SMTP_PASS.
  - Nếu báo "SMTP đã cấu hình" nhưng gửi vẫn lỗi: xem message lỗi trong toast; thường do sai mật khẩu (Gmail: dùng App Password) hoặc firewall/block port 587.

---

## Nếu Bước 4 (Deploy) bị Failed

1. **Xem log lỗi**
   - Vào Web Service → tab **Logs**.
   - Phân biệt: **Build logs** (lúc `npm install` / `npm run build`) và **Deploy logs** (lúc chạy `npm run start:prod`). Lỗi thường nằm ở dòng đỏ hoặc dòng cuối trước khi failed.

2. **Kiểm tra cấu hình**
   - **Root Directory**: phải là `backend` (chính xác, không dấu cách, không `/` cuối).
   - **Build Command**: `npm install && npm run build`.
   - **Start Command**: `npm run start:prod`.
   - **Environment**: có đủ `NODE_ENV`, `DATABASE_URL` (Internal URL từ Postgres), `JWT_SECRET`, `CORS_ORIGINS`.

3. **Đã chỉnh trong repo (nên pull mới nhất)**
   - **Node**: `backend/.nvmrc` = `20` và `package.json` có `"engines": { "node": ">=18.0.0" }` → Render dùng Node phù hợp.
   - **Prisma**: `prisma/schema.prisma` có `binaryTargets = ["native", "debian-openssl-3.0.x"]` → tránh lỗi “query engine” trên server Linux.

4. **Lỗi thường gặp**
   - **Build**: `prisma generate` hoặc `nest build` báo lỗi → xem log để biết thiếu env hay sai Node. Đảm bảo **không** set `NODE_ENV=production` **trong build** nếu Render mặc định đã set (hoặc set sau khi build xong); một số project cần devDependencies lúc build.
   - **Start**: “Cannot find module” hoặc “dist/main” not found → Build chưa ra `dist/main.js`. Kiểm tra Root Directory = `backend` và Build Command chạy đủ `npm run build`.
   - **DB**: “Can’t reach database” / connection refused → Dùng **Internal Database URL** (trong cùng Render), không dùng External khi chạy trên Render.

5. **Sau khi sửa**
   - Commit + push code (đã thêm `.nvmrc`, `engines`, `binaryTargets`) rồi bấm **Manual Deploy** → **Clear build cache & deploy** trên Render để build lại từ đầu.

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
| `JWT_SECRET`    | Có       | Chuỗi bí mật mạnh; nếu thiếu backend sẽ không khởi động |
| `JWT_EXPIRES_IN` | Không  | Mặc định `7d` |
| `CORS_ORIGINS`  | Có       | URL FE (Vercel) cách nhau dấu phẩy, hoặc `*` tạm thời |
| `PORT`          | Không    | Render tự set |

---

## Lưu ý Free tier

- **Sleep**: Sau ~15 phút không có request, service sẽ ngủ. Request đầu tiên sau đó có thể chậm 30s–1 phút (cold start).
- **Giới hạn**: RAM/CPU giới hạn; phù hợp demo / vài trăm user. Khi cần ổn định hơn, có thể nâng lên plan trả phí.

Sau khi backend chạy ổn, có thể deploy **Website** và **CRM** lên Vercel và set `VITE_API_URL` trỏ đúng URL trên.
