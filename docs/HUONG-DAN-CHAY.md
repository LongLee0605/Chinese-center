# Hướng dẫn chạy Backend & CRM – Chinese Center

Để chạy thử tạo bài viết, khóa học, bài học, bài test qua CRM.

---

## Đã thao tác sẵn cho bạn

- **`backend/.env`** – Đã tạo, dùng kết nối PostgreSQL (Docker: `chinese:chinese123@localhost:5432/chinese_center`). Nếu bạn dùng PostgreSQL khác hoặc database cloud, chỉ cần sửa lại `DATABASE_URL`.
- **Hai môi trường (local / production) – xem thêm mục "Tách biệt Local và Production" bên dưới:**
  - **Local:** Backend dùng **database local** (`DATABASE_URL` trỏ `localhost`). CRM và Website dùng `.env.development` → gọi `http://localhost:4000/api/v1`. Chạy backend trên máy: `cd backend && npm run dev`.
  - **Production:** Backend trên Render dùng **database Render**. CRM/Website deploy dùng `.env.production` hoặc biến Build → gọi `https://chinese-center.onrender.com/api/v1`.
  - Không trộn: khi chạy local, không set `DATABASE_URL` là URL database của Render.
- **`docker-compose.yml`** – Chạy PostgreSQL bằng một lệnh: `docker compose up -d`.
- **`scripts/start-dev.ps1`** – Script tự động: bật DB → push schema → seed → chạy Backend + CRM (cần Docker).

**Việc bạn cần làm:** Bật PostgreSQL (Docker hoặc cài sẵn hoặc database cloud), rồi chạy các lệnh ở mục 4, 5, 7 bên dưới.

---

## Tách biệt Local và Production (quan trọng)

Để **không bị lỗi ảnh** (upload local mà production lỗi) và **không lẫn data**, luôn tách rõ hai môi trường:

| | **Local** | **Production** |
|---|------------|----------------|
| **CRM** | Chạy `cd crm && npm run dev` → dùng `crm/.env.development` | Build deploy lên Cloudflare Pages → dùng biến Build `VITE_API_URL` (Render) |
| **Backend** | Chạy `cd backend && npm run dev` → dùng `backend/.env` | Deploy trên Render → env set trong Dashboard |
| **Database** | **Bắt buộc** dùng PostgreSQL **local** (Docker hoặc máy). `backend/.env` có `DATABASE_URL="postgresql://...@localhost:5432/..."` | Render Postgres → `DATABASE_URL` = Internal Database URL (set trên Render) |
| **Upload ảnh** | Lưu vào thư mục `backend/uploads/` trên máy | Lưu trên server Render |

**Quy tắc:**

- **Local backend** chỉ trỏ `DATABASE_URL` tới DB **local** (localhost / Docker). Không dùng URL database của Render khi chạy `npm run dev`.
- **CRM local** chỉ trỏ `VITE_API_URL` tới `http://localhost:4000/api/v1` (file `crm/.env.development`).
- **Production**: CRM trên Cloudflare gọi API Render; backend Render dùng database Render. Ảnh upload từ production CRM lưu trên Render.

Nếu bạn cấu hình đúng như trên, upload ảnh ở local sẽ không ảnh hưởng production và ngược lại. Cú pháp code và file env giống nhau, chỉ khác **giá trị** (localhost vs URL Render).

---

## 1. Yêu cầu

- **Node.js** 18+ (đã cài `node` và `npm`)
- **Docker Desktop** (để chạy PostgreSQL) — hoặc cài PostgreSQL trực tiếp trên máy

---

## 2. Chạy database (PostgreSQL)

### Cách A: Dùng Docker (khuyến nghị)

Mở terminal tại thư mục gốc repo (`Chinese-center`):

```bash
docker compose up -d
```

Kiểm tra container chạy: `docker ps` — thấy container `chinese-center-db` là được.

### Cách B: PostgreSQL cài sẵn trên máy

- Tạo database tên `chinese_center`.
- Ghi nhớ **user**, **password**, **port** (mặc định 5432) để điền vào `backend/.env` bên dưới.

### Cách C: Database cloud (không cần Docker)

- Dùng [Neon](https://neon.tech) hoặc [Supabase](https://supabase.com) (PostgreSQL miễn phí).
- Tạo project → lấy **connection string** (URL dạng `postgresql://...`).
- Dán vào `backend/.env` thành `DATABASE_URL="postgresql://..."`.

---

## 3. Cấu hình Backend

1. Vào thư mục backend và tạo file `.env` từ mẫu:

   ```bash
   cd backend
   copy .env.example .env
   ```

2. Mở `backend/.env` và sửa **ít nhất** dòng `DATABASE_URL`:

   - **Nếu dùng Docker Compose ở bước 2:**

     ```env
     DATABASE_URL="postgresql://chinese:chinese123@localhost:5432/chinese_center?schema=public"
     ```

   - **Nếu dùng PostgreSQL tự cài:** thay đúng user, password, port, tên database:

     ```env
     DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/chinese_center?schema=public"
     ```

   Các biến khác có thể giữ mặc định khi chạy thử:

   - `JWT_SECRET` — giữ hoặc đổi chuỗi bất kỳ
   - `PORT=4000`
   - `CORS_ORIGINS="http://localhost:5173,http://localhost:5174"`

---

## 4. Cài đặt & khởi tạo Backend

Trong thư mục `backend`:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

- `db push`: tạo bảng trong database.
- `db:seed`: tạo tài khoản đăng nhập CRM:
  - **Email:** `admin@chinese-center.local`
  - **Mật khẩu:** `admin123`

---

## 5. Chạy Backend

Vẫn trong `backend`:

```bash
npm run dev
```

Khi thấy dòng kiểu: **API running at http://localhost:4000/api/v1** — backend đã chạy.

Giữ terminal này mở (hoặc chạy trong background).

---

## 6. Cấu hình CRM (local)

CRM đã có sẵn **`.env.development`** trong repo → khi chạy `npm run dev` sẽ tự gọi `http://localhost:4000/api/v1`. Không bắt buộc tạo `crm/.env` nữa.

Nếu muốn ghi đè (vd. backend chạy port khác), tạo `crm/.env`:

```bash
cd crm
copy .env.example .env
```

Rồi sửa `VITE_API_URL` trong `crm/.env` nếu cần (vd. backend port khác 4000).

---

## 7. Cài đặt & chạy CRM

Trong thư mục `crm`:

```bash
npm install
npm run dev
```

Khi chạy xong, mở trình duyệt: **http://localhost:5174**

---

## 8. Đăng nhập CRM và thử nghiệm

1. **Đăng nhập**
   - Vào http://localhost:5174
   - Email: `admin@chinese-center.local`
   - Mật khẩu: `admin123`

2. **Tạo bài viết**
   - Menu **Bài viết** → **Thêm bài viết**
   - Điền Tiêu đề, Slug (vd: `bai-viet-dau-tien`), Mô tả ngắn, Nội dung, Trạng thái (Nháp / Xuất bản) → **Lưu**

3. **Tạo khóa học**
   - Cần có API tạo khóa (hoặc thêm nút “Thêm khóa học” trong CRM).  
   - Hiện tại: vào **Khóa học** xem danh sách; khi đã có khóa thì vào từng khóa để **Thêm bài học** (tiêu đề, slug, loại VIDEO/DOCUMENT/QUIZ, nội dung, URL video, Xuất bản).

4. **Tạo khóa học**
   - **Khóa học** → **Thêm khóa học** → điền Mã, Slug, Tên, Cấp độ, Thời lượng, Giá, Trạng thái… → **Tạo khóa học**. Sau đó vào khóa vừa tạo để **Thêm bài học**.

5. **Tạo bài test**
   - **Bài test** → **Thêm bài test** → chọn **Loại bài test**: Trắc nghiệm / Tự luận / Hỗn hợp (cả hai), nhập Tiêu đề, Slug → **Tạo**
   - Mở bài test vừa tạo → **Thêm câu hỏi**: với Trắc nghiệm chỉ thêm câu trắc nghiệm hoặc Đúng/Sai; với Tự luận chỉ thêm Tự luận ngắn hoặc Tự luận; với Hỗn hợp được chọn tất cả → **Lưu**
   - Có thể chỉnh **Cài đặt bài test**: Loại bài test, thời gian (phút), Điểm đạt (%), bật **Xuất bản**

6. **Gửi email**
   - **Gửi email** (menu) → nhập Người nhận (nhiều email cách nhau bằng dấu phẩy), Tiêu đề, Nội dung → **Gửi email**. Cần cấu hình SMTP trong `backend/.env` (SMTP_HOST, SMTP_USER, SMTP_PASS). Nếu chưa cấu hình, trang Mail sẽ báo "SMTP chưa cấu hình" — các chức năng khác của CRM vẫn dùng bình thường.

---

## 9. Tóm tắt lệnh (đã có Docker & .env)

**Cách 1 – Tự động (PowerShell, đã cài Docker):**

```powershell
.\scripts\start-dev.ps1
```

Script sẽ: bật PostgreSQL (Docker), push schema, seed, chạy Backend và CRM trong 2 cửa sổ mới.

**Cách 2 – Từng bước (3 terminal):**

**Terminal 1 – Database (nếu dùng Docker):**

```bash
docker compose up -d
```

**Terminal 2 – Backend:**

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

**Terminal 3 – CRM:**

```bash
cd crm
npm install
npm run dev
```

Sau đó mở http://localhost:5174 và đăng nhập bằng tài khoản seed.

---

## 10. Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| `prisma db push` báo lỗi kết nối DB | Kiểm tra Docker đã chạy (`docker ps`) hoặc PostgreSQL đã bật; kiểm tra lại `DATABASE_URL` trong `backend/.env`. |
| CRM báo lỗi khi đăng nhập / gọi API | Kiểm tra Backend đang chạy (http://localhost:4000/api/v1); kiểm tra `crm/.env` có `VITE_API_URL=http://localhost:4000/api/v1`. |
| CORS | Đảm bảo `backend/.env` có `CORS_ORIGINS="http://localhost:5173,http://localhost:5174"` (hoặc đúng port CRM đang chạy). |

Nếu bạn muốn, tôi có thể thao tác từng bước (tạo .env, chạy lệnh) trực tiếp trong project của bạn.
