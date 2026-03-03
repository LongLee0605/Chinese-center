/**
 * Phân quyền xem nội dung (bài viết, khóa học, bài test).
 * - SUPER_ADMIN (admin@chinese-center.local), TEACHER: toàn quyền xem/sửa, không phụ thuộc visibleToRoles/allowGuest. (Đã bỏ quyền ADMIN.)
 * - Học viên (STUDENT): chỉ xem nội dung có visibleToRoles cho phép (rỗng = tất cả, không rỗng = phải có STUDENT).
 * - Khách (chưa đăng nhập): chỉ xem nội dung được cấu hình "cho phép hiển thị cho người không login" (allowGuest với course/quiz, visibleToRoles rỗng với post).
 */

const STAFF_ROLES = ['SUPER_ADMIN', 'TEACHER'];

/** Role hiện tại: string hoặc null (khách chưa đăng nhập). */
export type UserRoleOrGuest = string | null;

/** SUPER_ADMIN, TEACHER: toàn quyền với bài viết, khóa học, bài test (xem/sửa mọi nội dung). */
export function isStaffRole(role: UserRoleOrGuest): boolean {
  return role != null && STAFF_ROLES.includes(role);
}

/** Nội dung có allowGuest + visibleToRoles (Course, Quiz). */
export function canAccessWithGuest(
  allowGuest: boolean,
  visibleToRoles: string[] | null | undefined,
  userRole: UserRoleOrGuest,
): boolean {
  const roles = Array.isArray(visibleToRoles) ? visibleToRoles : [];
  if (isStaffRole(userRole)) return true;
  if (userRole != null) {
    if (roles.length === 0) return true;
    return roles.includes(userRole);
  }
  return allowGuest === true;
}

/** Bài viết: visibleToRoles + allowGuest (nếu có). Khách chỉ xem khi allowGuest === true. */
export function canAccessPost(
  visibleToRoles: string[] | null | undefined,
  userRole: UserRoleOrGuest,
  allowGuest?: boolean,
): boolean {
  const roles = Array.isArray(visibleToRoles) ? visibleToRoles : [];
  if (isStaffRole(userRole)) return true;
  if (userRole != null) {
    if (roles.length === 0) return true;
    return roles.includes(userRole);
  }
  if (allowGuest !== undefined) return allowGuest === true;
  return roles.length === 0;
}

/** Điều kiện Prisma "where" để list Course PUBLISHED mà user/guest được xem. */
export function courseListWhere(userRole: UserRoleOrGuest) {
  const base = { status: 'PUBLISHED' as const };
  if (isStaffRole(userRole)) return base;
  if (userRole != null) {
    return {
      ...base,
      OR: [
        { allowGuest: true },
        { visibleToRoles: { isEmpty: true } },
        { visibleToRoles: { has: userRole } },
      ],
    };
  }
  return { ...base, allowGuest: true };
}

/** Điều kiện Prisma "where" để list Quiz isPublished mà user/guest được xem. */
export function quizListWhere(userRole: UserRoleOrGuest) {
  const base = { isPublished: true };
  if (isStaffRole(userRole)) return base;
  if (userRole != null) {
    return {
      ...base,
      OR: [
        { allowGuest: true },
        { visibleToRoles: { isEmpty: true } },
        { visibleToRoles: { has: userRole } },
      ],
    };
  }
  return { ...base, allowGuest: true };
}

/** Điều kiện Prisma "where" để list Post PUBLISHED mà user/guest được xem. */
export function postListWhere(userRole: UserRoleOrGuest) {
  const base = { status: 'PUBLISHED' as const };
  if (isStaffRole(userRole)) return base;
  if (userRole != null) {
    return {
      ...base,
      OR: [
        { visibleToRoles: { isEmpty: true } },
        { visibleToRoles: { has: userRole } },
      ],
    };
  }
  return { ...base, visibleToRoles: { isEmpty: true } };
}
