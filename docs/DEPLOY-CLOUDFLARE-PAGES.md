# Deploy Website & CRM lên Cloudflare Pages – Hướng dẫn chi tiết

Hướng dẫn từng bước deploy **Website** (frontend công khai) và **CRM** (quản trị) lên Cloudflare Pages, đúng với cấu trúc source hiện tại của dự án Chinese-center.

---

## 1. Cấu trúc source (đúng với repo)

```
Chinese-center/                    ← Gốc repo (GitHub)
├── package.json                   ← Website: scripts.build = "tsc -b && vite build"
├── vite.config.ts
├── index.html
├── src/
├── dist/                          ← Output build Website (sau npm run build)
│
├── crm/
│   ├── package.json               ← CRM: scripts.build = "tsc -b && vite build"
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   └── dist/                      ← Output build CRM (sau npm run build, chạy trong crm/)
│
└── backend/                        ← Không dùng cho deploy Pages
```

- **Website**: build tại **gốc repo**, lệnh `npm run build`, thư mục ra là **`dist`** (ngang hàng với `src/`, `index.html`).
- **CRM**: build trong thư mục **`crm`**, lệnh `npm run build`, thư mục ra là **`dist`** (nằm trong `crm/`, tức `crm/dist`).

Cả hai đều dùng biến môi trường **`VITE_API_URL`** lúc build (trong source: `src/lib/api.ts` và `crm/src/api/client.ts`). Giá trị production hiện tại: **`https://chinese-center.onrender.com/api/v1`** (backend Render).

---

## 2. Chuẩn bị trước khi deploy

- Tài khoản **Cloudflare** (đăng ký tại https://dash.cloudflare.com).
- Repo **Chinese-center** đã đẩy lên **GitHub** (branch deploy: thường là `main`).
- Backend NestJS đã chạy trên **Render**, có URL dạng:  
  `https://chinese-center.onrender.com`  
  (API prefix: `/api/v1` → full API base: `https://chinese-center.onrender.com/api/v1`).
- Backend đã cấu hình **CORS**: trong `backend/src/main.ts`, origin lấy từ biến môi trường **`CORS_ORIGINS`** (chuỗi nhiều URL cách nhau bởi dấu phẩy, có thể trim khoảng trắng). Cần thêm đúng URL Cloudflare Pages (và custom domain nếu có) vào đây thì trình duyệt mới cho gọi API.

---

## 3. Kiểm tra build local (nên làm trước)

Đảm bảo build không lỗi trước khi cấu hình Cloudflare.

**Website (tại thư mục gốc):**

```bash
cd C:\Users\longle\Desktop\source\Chinese-center
npm install
npm run build
```

- Thành công: xuất hiện thư mục **`dist`** (có `index.html`, `assets/`, v.v.).
- Nếu lỗi: sửa lỗi TypeScript/Vite trước, không deploy.

**CRM (trong thư mục crm):**

```bash
cd crm
npm install
npm run build
```

- Thành công: xuất hiện thư mục **`crm/dist`** (có `index.html`, `assets/`, v.v.).

---

## 4. Cấu hình CORS trên Backend (Render)

Frontend trên Cloudflare Pages gọi API qua domain khác (cross-origin), nên backend phải cho phép origin của Pages.

1. Vào https://dashboard.render.com → đăng nhập → chọn **Web Service** chạy backend (vd: `chinese-center-api`).
2. Tab **Environment** → tìm biến **`CORS_ORIGINS`**.
3. **Nếu chưa có:** bấm **Add Environment Variable** → Key: `CORS_ORIGINS`, Value: tạm để hai URL Cloudflare (sẽ có sau khi tạo project), ví dụ:
   ```text
   https://chinese-center-web.pages.dev,https://chinese-center-crm.pages.dev
   ```
   (Lưu ý: chỉ dùng dấu phẩy, không dấu cách; nếu có domain cũ như Vercel thì thêm vào cùng, ví dụ:  
   `https://old.vercel.app,https://chinese-center-web.pages.dev,https://chinese-center-crm.pages.dev`.)
4. **Nếu đã có:** sửa Value, thêm hai URL trên (cách nhau bởi dấu phẩy).
5. Bấm **Save Changes**. Render sẽ tự redeploy backend; đợi deploy xong.

Sau khi deploy xong Website và CRM (Bước 6, 7), quay lại đây chỉnh lại `CORS_ORIGINS` cho đúng với **URL thật** Cloudflare đã gán (xem Bước 8).

---

## 5. Tạo project Cloudflare Pages cho Website

### 5.1. Vào trang tạo project

1. Đăng nhập https://dash.cloudflare.com.
2. Menu bên trái: **Workers & Pages**.
3. Bấm **Create** → **Pages** → **Connect to Git**.

### 5.2. Kết nối repo

1. Chọn **GitHub** → **Authorize** (nếu chưa kết nối).
2. Chọn **repository**: repo chứa code Chinese-center (vd: `Chinese-center`).
3. Bấm **Begin setup**.

### 5.3. Cấu hình build – Website

Trên màn hình **Set up builds and deployments**:

| Trường trong form | Giá trị nhập | Ghi chú |
|-------------------|--------------|--------|
| **Project name** | `chinese-center-web` | Tên hiển thị; subdomain sẽ là `chinese-center-web.pages.dev`. Có thể đổi tên khác. |
| **Production branch** | `main` | Đúng với branch bạn dùng để deploy (nếu dùng `master` thì điền `master`). |
| **Build configuration** | Chọn **Framework preset** = **Vite** (hoặc bấm **Configure build** để nhập tay). |

Sau khi chọn **Configure build** (hoặc mở phần build settings):

| Trường | Giá trị | Đúng với source |
|--------|--------|------------------|
| **Build command** | `npm run build` | Đúng với `package.json` gốc (script `build` = `tsc -b && vite build`). |
| **Build output directory** | `dist` | Vite build ra `dist` tại gốc repo. |
| **Root directory** | *(để trống)* | Website nằm ở gốc repo; không điền `crm` hay path khác. |

- **Environment variables (Build):** bấm **Add variable** (hoặc **Add environment variable**), thêm:

| Variable name | Value | Environment |
|---------------|--------|-------------|
| `VITE_API_URL` | `https://chinese-center.onrender.com/api/v1` | Production (và Preview nếu muốn) |
| `NODE_VERSION` | `20` | Production (và Preview) |

- `VITE_API_URL` phải trùng với API backend Render (trong source: `src/lib/api.ts` dùng `import.meta.env.VITE_API_URL`; fallback production là `https://chinese-center.onrender.com/api/v1`).
- `NODE_VERSION` tránh Cloudflare dùng Node cũ gây lỗi build.

Bấm **Save and Deploy**. Đợi build chạy (log có thể xem trong **Deployments**). Nếu thành công, trang sẽ có URL dạng:

```text
https://chinese-center-web.pages.dev
```

(Ghi lại URL này; nếu đổi Project name thì subdomain sẽ khác.)

---

## 6. Tạo project Cloudflare Pages cho CRM

### 6.1. Tạo project mới (cùng repo)

1. Vẫn trong **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Chọn **GitHub** → chọn **cùng repo** Chinese-center → **Begin setup**.

### 6.2. Cấu hình build – CRM

Trên màn hình **Set up builds and deployments**:

| Trường | Giá trị | Ghi chú |
|--------|--------|--------|
| **Project name** | `chinese-center-crm` | Subdomain: `chinese-center-crm.pages.dev`. |
| **Production branch** | `main` | Cùng branch với Website. |
| **Build configuration** | **Configure build** (hoặc Framework preset Vite). |

Trong phần build settings:

| Trường | Giá trị | Đúng với source |
|--------|--------|------------------|
| **Build command** | `npm run build` | Đúng với `crm/package.json` (script `build` = `tsc -b && vite build`). |
| **Build output directory** | `dist` | Trong thư mục `crm`, Vite build ra `dist` → output là `crm/dist`; với Cloudflare khi Root directory = `crm`, bạn chỉ cần nhập **`dist`** (tương đối so với root `crm`). |
| **Root directory** | `crm` | **Bắt buộc.** Cloudflare sẽ chạy `npm install` và `npm run build` trong thư mục `crm`, dùng `crm/package.json` và `crm/vite.config.ts`. |

Environment variables (Build):

| Variable name | Value | Environment |
|---------------|--------|-------------|
| `VITE_API_URL` | `https://chinese-center.onrender.com/api/v1` | Production (và Preview) |
| `NODE_VERSION` | `20` | Production (và Preview) |

Bấm **Save and Deploy**. URL sau khi deploy thành công dạng:

```text
https://chinese-center-crm.pages.dev
```

(Ghi lại URL này.)

---

## 7. Cập nhật CORS với URL thật

Sau khi cả hai project deploy thành công:

1. Vào **Render** → Web Service backend → **Environment**.
2. Sửa **`CORS_ORIGINS`** thành chuỗi chính xác hai URL (không khoảng trắng thừa, không `https://` thiếu):
   ```text
   https://chinese-center-web.pages.dev,https://chinese-center-crm.pages.dev
   ```
   - Nếu bạn đặt Project name khác, thay bằng subdomain thật (vd: `https://ten-cua-ban.pages.dev`).
   - Nếu đã gắn custom domain (Bước 9), thêm domain đó vào (vd: `https://yourdomain.com,https://crm.yourdomain.com`).
3. **Save** → đợi backend redeploy xong.

Sau bước này, mở Website và CRM trên Pages, thử:
- Website: xem trang chủ, tin tức, khóa học; kiểm tra không lỗi CORS trên console (F12).
- CRM: đăng nhập (email admin đã seed), vào các màn quản lý; kiểm tra gọi API và upload ảnh (nếu có) hoạt động.

---

## 8. Không ảnh hưởng giao diện / chức năng

- **Code:** Không cần sửa code. Chỉ cấu hình đúng **Root directory**, **Build command**, **Build output directory** và **Environment variables** trên Cloudflare.
- **API:** Cùng `VITE_API_URL` như trong `.env.production` / fallback trong `src/lib/api.ts` và `crm/src/api/client.ts` → hành vi giống build production local.
- **Router / base:** Cả hai app dùng base mặc định (`/`); mỗi app một domain nên không cần chỉnh `base` trong Vite.
- **Ảnh / upload:** Ảnh do backend Render serve tại `/uploads`; frontend build URL từ `getUploadsBase()` (suy từ `VITE_API_URL`). Không cần đổi logic.

---

## 9. Custom domain (tùy chọn)

- Trong từng project Pages: **Custom domains** → **Set up a custom domain** → nhập domain (vd: `yourdomain.com`, `crm.yourdomain.com`).
- Trỏ DNS theo hướng dẫn Cloudflare (CNAME hoặc A/AAAA). SSL do Cloudflare cấp.
- Sau khi gắn domain, cập nhật **`CORS_ORIGINS`** trên Render thêm URL mới (vd: `https://yourdomain.com`, `https://crm.yourdomain.com`).

---

## 10. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
|-------------|--------------------|------------|
| `The lockfile would have been modified by this install` (Yarn) | Cloudflare dùng **Yarn** vì thấy `yarn.lock`; dự án đang dùng **npm** (`package-lock.json`). Yarn 4 từ chối khi lockfile không khớp. | **Website:** Xóa `yarn.lock` ở **gốc repo** (chỉ giữ `package-lock.json`) → commit & push → Redeploy. **CRM:** Nếu lỗi tương tự khi build CRM, xóa `crm/yarn.lock` (chỉ giữ `crm/package-lock.json`) → commit & push → Redeploy. Cloudflare sẽ tự dùng npm khi chỉ còn `package-lock.json`. |
| Build failed (Website) | Thiếu `VITE_API_URL` hoặc Node version không tương thích | Thêm biến `VITE_API_URL` và `NODE_VERSION=20` trong **Build** environment; **Redeploy**. |
| Build failed (CRM) | Build chạy ở gốc repo thay vì trong `crm` | Kiểm tra **Root directory** = `crm` (chính xác, không `/crm` hay `./crm`). |
| Trang trắng / 404 khi vào route con | SPA cần fallback `index.html` | Cloudflare Pages mặc định đã xử lý SPA (mọi path trả về `index.html`). Nếu vẫn lỗi, kiểm tra **Build output directory** đúng là `dist` (Website) hoặc `dist` với Root `crm` (CRM). |
| CORS error trên trình duyệt | Backend chưa cho phép origin Pages | Kiểm tra **`CORS_ORIGINS`** trên Render có đúng URL (vd: `https://chinese-center-web.pages.dev`, `https://chinese-center-crm.pages.dev`), không thiếu `https://`, không dùng `*` nếu backend dùng `credentials: true`. |
| API / ảnh không load | Sai `VITE_API_URL` lúc build | Sửa biến **Build** `VITE_API_URL` trong project Pages → **Redeploy** (Deployments → … → Retry deployment). |

---

## 11. Tóm tắt bảng cấu hình

| Nội dung | Website | CRM |
|----------|---------|-----|
| **Project name (Cloudflare)** | `chinese-center-web` | `chinese-center-crm` |
| **Repo** | Cùng repo Chinese-center | Cùng repo |
| **Production branch** | `main` | `main` |
| **Root directory** | *(trống)* | `crm` |
| **Build command** | `npm run build` | `npm run build` |
| **Build output directory** | `dist` | `dist` |
| **Build env** | `VITE_API_URL=https://chinese-center.onrender.com/api/v1`, `NODE_VERSION=20` | Giống trên |
| **CORS_ORIGINS (Render)** | Thêm `https://chinese-center-web.pages.dev` | Thêm `https://chinese-center-crm.pages.dev` |

Làm đúng theo từng bước trên thì build và chức năng hiện tại sẽ giữ nguyên, không ảnh hưởng giao diện hay logic.
