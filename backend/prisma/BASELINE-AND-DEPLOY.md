# Baseline database production rồi chạy migration (khi gặp P3005)

Khi database đã có sẵn bảng (tạo bằng `db push` hoặc tay) nhưng chưa dùng Migrate, Prisma báo:

```
Error: P3005 - The database schema is not empty.
```

Làm lần lượt trong thư mục `backend`:

## Bước 1: Đánh dấu migration cũ đã áp dụng (baseline)

Chạy **một** trong hai lệnh (tùy bạn đã có cột `isFreePreview` trong bảng `lessons` chưa):

- **Nếu chưa chắc** hoặc chưa có cột `isFreePreview`: chạy SQL của migration đầu rồi mới resolve.

  ```bash
  npx prisma db execute --file prisma/migrations/20250126000000_add_lesson_is_free_preview/migration.sql
  ```

  Sau đó:

  ```bash
  npx prisma migrate resolve --applied "20250126000000_add_lesson_is_free_preview"
  ```

- **Nếu chắc** bảng `lessons` đã có cột `isFreePreview`: chỉ cần resolve:

  ```bash
  npx prisma migrate resolve --applied "20250126000000_add_lesson_is_free_preview"
  ```

## Bước 2: Chạy migration còn lại

```bash
npx prisma migrate deploy
```

Lệnh này sẽ chỉ chạy migration `20250126100000_enrollment_requests_trial_user_trial_fields` (bảng yêu cầu đăng ký, học thử, cột trial trên user).

Sau khi xong, kiểm tra lại schema trong DB (bảng `_prisma_migrations`, bảng mới, cột mới) cho khớp với Prisma.
