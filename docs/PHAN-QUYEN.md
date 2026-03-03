# Phân quyền ứng dụng

## Các vai trò (role)

| Role | Mô tả | Quyền trên CRM | Quyền trên Website |
|------|--------|-----------------|---------------------|
| **SUPER_ADMIN** | Super Admin (admin@chinese-center.local) | Toàn quyền: tài khoản, giảng viên, bài viết, khóa học, bài test, lead, mail. | Toàn quyền: xem/sửa mọi nội dung. |
| **TEACHER** | Giảng viên | Toàn quyền **trừ** quản lý user (Bài viết, Khóa học, Bài test, Lead, Mail). Không truy cập Tài khoản. | Toàn quyền với bài viết, khóa học, bài test. |
| **STUDENT** | Học viên | Không truy cập CRM. | Chỉ xem bài viết, khóa học và làm bài test được cấu hình cho phép. |
| *(khách)* | Chưa đăng nhập | — | Chỉ xem bài viết, bài giảng, bài test được cấu hình hiển thị công khai. |
| **ADMIN** | (đã bỏ quyền) | Không còn vai trò đặc biệt; nếu còn trong DB thì xử lý như học viên. | Chỉ xem nội dung được cấu hình cho phép (như học viên). |

## Cấu hình Super Admin

Tài khoản **admin@chinese-center.local** được tạo với role **SUPER_ADMIN** khi chạy seed:

```bash
cd backend
npm run db:seed
```

Mật khẩu mặc định (đổi ngay sau lần đăng nhập đầu): **admin123**.

## CRM – Menu theo role

- **Super Admin**: thấy đầy đủ menu (Tổng quan, **Tài khoản**, Bài viết, Khóa học, Bài test, **Giảng viên**, Email đăng ký, Gửi email).
- **Giảng viên**: toàn quyền trừ quản lý user — không thấy "Tài khoản"; có Bài viết, Khóa học, Bài test, Lead, Mail (và Giảng viên nếu được cấu hình).
- **Học viên / Admin (đã bỏ quyền)**: đăng nhập CRM sẽ thấy thông báo "Bạn không có quyền truy cập CRM" và nút Đăng xuất.

## Quản lý tài khoản (chỉ Super Admin)

Trang **Tài khoản** trong CRM cho phép:

- Xem danh sách tài khoản (lọc theo vai trò).
- Thêm tài khoản mới (email, mật khẩu, họ tên, vai trò, trạng thái).
- Sửa thông tin (họ tên, số điện thoại, vai trò, trạng thái, đổi mật khẩu).
- Xóa tài khoản.

Chỉ user có role **SUPER_ADMIN** mới truy cập được API `/users` và trang Quản lý tài khoản.

## Phân quyền xem nội dung (bài viết, khóa học, bài test)

Quy định **nghiêm ngặt**: mỗi bài viết, khóa học, bài test phải có phần cấu hình **cho phép hiển thị** thì mới được học viên / người không đăng nhập xem.

- **Super Admin** (admin@chinese-center.local): **toàn quyền** trên website và CRM — luôn xem/sửa được mọi bài viết, khóa học, bài test, không phụ thuộc cấu hình.
- **Giảng viên**: **toàn quyền** với bài viết, khóa học, bài test — luôn xem/sửa được mọi nội dung (CRM và website), không phụ thuộc `visibleToRoles` / `allowGuest`. Chỉ không truy cập phần quản lý user.
- **Học viên**: chỉ xem bài viết, khóa học và làm bài test **được cấu hình cho phép** (xem mục dưới).
- **Người không đăng nhập**: chỉ xem bài viết, bài giảng, bài test **được cấu hình hiển thị công khai** (allowGuest với khóa học/bài test, hoặc bài viết để trống vai trò).

Trong CRM, khi tạo/sửa **bài viết**, **khóa học** hoặc **bài test** có hai nhóm tùy chọn:

1. **Vai trò được xem** (`visibleToRoles`): checkbox Super Admin, Admin, Giảng viên, Học viên.  
   - **Để trống** = tất cả **học viên** đều được xem (và làm bài với quiz).  
   - **Chọn một hoặc nhiều vai trò** = chỉ những vai trò đó (trong số đã chọn) được xem/làm.  
   - *Super Admin và Giảng viên luôn xem được, không phụ thuộc mục này.*

2. **Cho phép khách** (chỉ Khóa học & Bài test): checkbox "Cho phép khách (chưa đăng nhập) xem…".  
   - Bật = nội dung hiển thị và có thể làm bài khi **chưa đăng nhập** (Course `status = PUBLISHED`, Quiz `isPublished = true`).

API: `GET /api/v1/courses/public`, `GET /api/v1/quizzes/published`, `GET /api/v1/posts` — khi không gửi token trả về chỉ nội dung cho phép khách; khi gửi token (học viên / staff) trả về theo role.

Sau khi thêm cột `allowGuest`, cần chạy:

```bash
cd backend
npx prisma db push
```

(hoặc tạo migration nếu dự án dùng migration.)

## Tóm tắt API theo quyền

| API | Super Admin | Teacher | Student |
|-----|-------------|---------|--------|
| GET/POST/PUT/DELETE /users | ✓ | — | — |
| GET/POST/PUT/DELETE /teachers (CRM) | ✓ | — | — |
| Mail (send, sent, check) | ✓ | ✓ | — |
| Courses, Lessons, Quizzes (CRUD) | ✓ | ✓ | — |
| Posts, Leads | ✓ | ✓ | — |
| GET /courses/public, quizzes/published, posts | Công khai (guest) / theo role khi có token | | |
