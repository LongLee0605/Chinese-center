# Tối ưu luồng chạy & bảo trì

Tài liệu tóm tắt các tối ưu đã áp dụng và gợi ý bước tiếp theo (không đổi giao diện/chức năng).

---

## Đã thực hiện

### Backend
- **UsersService.findAll:** Bỏ gọi `cleanupExpiredTrialUsers()` mỗi lần list. Cleanup trial hết hạn vẫn chạy khi login (auth) khi phát hiện tài khoản hết hạn. List tài khoản CRM nhanh hơn, giảm tải DB.

### CRM
- **API client (client.ts):**
  - Gom xử lý 401 vào `handleUnauthorized()` và `fetchWithAuth()`. Tất cả gọi API (kể cả upload ảnh posts/courses, avatar) dùng chung logic: 401 → xóa token/user, redirect `/login`. Code dễ bảo trì, tránh lệch hành vi.
- **CourseDetail:**
  - Gộp hai fetch (enrollments + enrollment requests) thành một `useEffect`: gọi song song `Promise.all([getEnrollments, enrollmentRequestsApi.list])` khi có `id`. Giảm số lần render loading, tải dữ liệu nhanh hơn.
  - Danh sách users (thêm học viên) vẫn chỉ load khi mở modal (`showAddEnrollment`).

### Website
- **Một nguồn "me":**
  - AuthContext là nguồn duy nhất: init gọi `GET /auth/me` (full profile), sau login gọi thêm `authApi.me()` để lấy full profile và lưu vào state.
  - Thêm `refetchMe()` trong AuthContext để cập nhật profile khi cần (sau đăng ký khóa, cập nhật tài khoản, v.v.).
  - AccountPage và CourseDetailPage dùng `useAuth().user` thay vì `useGetMeQuery`. Tránh gọi trùng `GET /users/me` và `GET /auth/me`, giảm request và đơn giản hóa luồng.

---

## Gợi ý bước tiếp theo (tùy chọn)

- **Backend:** Nếu cần dọn trial hết hạn định kỳ (không phụ thuộc login), có thể thêm endpoint `POST /admin/cleanup-expired-trials` (chỉ SUPER_ADMIN) và gọi từ cron.
- **CRM:** Tách Component lớn (ClassDetail, CourseDetail) thành các component con (ClassMembersList, GuestRequestsList, AddMemberModal, …) để dễ đọc và tái sử dụng.
- **Website:** Có thể chuyển schedule (getClasses, joinClass, registerRequest) sang RTK Query để dùng cache và invalidation thống nhất với phần còn lại.
- **Shared:** Nếu có monorepo hoặc package dùng chung, có thể tách `getApiBase`, `toImageUrl`, `bodyHtmlForDisplay`, `api()` cơ bản và type AuthUser/Class để CRM và Website dùng chung, giảm trùng lặp.

---

*Cập nhật theo đợt tối ưu luồng chạy.*
