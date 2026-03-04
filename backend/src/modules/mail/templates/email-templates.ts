/**
 * HTML email templates – inline styles for compatibility with major email clients.
 * Max-width 600px, single column, modern and readable.
 */

const BRAND_NAME = 'Chinese Center';
const PRIMARY_COLOR = '#0f766e';
const PRIMARY_HOVER = '#0d6961';
const PRIMARY_LIGHT = '#ccfbf1';
const BORDER_COLOR = '#e5e7eb';
const TEXT_COLOR = '#1f2937';
const TEXT_MUTED = '#6b7280';
const BG_SOFT = '#f8fafc';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(s: string): string {
  return s.replace(/\n/g, '<br>');
}

function baseWrapper(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ?? BRAND_NAME}</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; color: ${TEXT_COLOR}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
          ${content}
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: ${TEXT_MUTED};">
          Email từ ${BRAND_NAME}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function headerSection(subject: string, badge?: { text: string; bg?: string; color?: string }): string {
  const badgeStyle = badge
    ? `display: inline-block; margin-top: 16px; padding: 8px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${badge.bg ?? 'rgba(255,255,255,0.2)'}; color: ${badge.color ?? '#fff'};`
    : '';
  return `
  <tr>
    <td style="padding: 40px 40px 32px; background: linear-gradient(145deg, ${PRIMARY_COLOR} 0%, #134e4a 100%);">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
        ${BRAND_NAME}
      </h1>
      <p style="margin: 14px 0 0; font-size: 16px; color: rgba(255,255,255,0.92); line-height: 1.4;">
        ${subject}
      </p>
      ${badge ? `<span style="${badgeStyle}">${badge.text}</span>` : ''}
    </td>
  </tr>`;
}

function row(label: string, value: string, isHighlight = false): string {
  return `
  <tr>
    <td style="padding: 14px 40px; border-bottom: 1px solid ${BORDER_COLOR};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: ${TEXT_MUTED}; width: 130px; vertical-align: top; padding-top: 2px;">
            ${label}
          </td>
          <td style="font-size: 15px; color: ${isHighlight ? PRIMARY_COLOR : TEXT_COLOR}; font-weight: ${isHighlight ? 600 : 400}; word-break: break-word; line-height: 1.5;">
            ${value}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Nút CTA chính */
function btnPrimary(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; padding: 14px 28px; background: ${PRIMARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(15, 118, 110, 0.3);">${label}</a>`;
}

// --------------- Lead / Liên hệ (gửi cho admin) ---------------

export function leadNotificationToAdmin(data: {
  type: 'TU_VAN' | 'DANG_KY_HOC_THU';
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  courseInterest?: string | null;
  timePreference?: string | null;
  note?: string | null;
  createdAt: Date;
}): string {
  const typeLabel = data.type === 'TU_VAN' ? 'Tư vấn / Liên hệ' : 'Đăng ký học thử';
  const badge = data.type === 'DANG_KY_HOC_THU'
    ? { text: 'Đăng ký học thử', bg: '#d1fae5', color: '#065f46' }
    : { text: 'Tư vấn', bg: '#dbeafe', color: '#1e40af' };

  const rows = [
    row('Họ tên', escapeHtml(data.name), true),
    row('Email', `<a href="mailto:${escapeHtml(data.email)}" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-weight: 500;">${escapeHtml(data.email)}</a>`),
    row('Điện thoại', `<a href="tel:${escapeHtml(data.phone)}" style="color: ${TEXT_COLOR}; text-decoration: none;">${escapeHtml(data.phone)}</a>`),
    data.message ? row('Nội dung', nl2br(escapeHtml(data.message))) : '',
    data.courseInterest ? row('Khóa quan tâm', escapeHtml(data.courseInterest)) : '',
    data.timePreference ? row('Khung giờ', nl2br(escapeHtml(data.timePreference))) : '',
    data.note ? row('Ghi chú', nl2br(escapeHtml(data.note))) : '',
    row('Thời gian gửi', data.createdAt.toLocaleString('vi-VN')),
  ].filter(Boolean).join('');

  const replyMailto = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent('Re: ' + typeLabel + ' - ' + data.name)}`;
  const content = `
  ${headerSection('Đăng ký mới từ website', badge)}
  ${rows}
  <tr>
    <td style="padding: 28px 40px 36px; background-color: ${BG_SOFT}; border-top: 1px solid ${BORDER_COLOR};">
      <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_MUTED}; line-height: 1.5;">
        Reply trực tiếp email này để phản hồi khách. <strong>Reply-To</strong> đã được đặt là email của người gửi.
      </p>
      <p style="margin: 0;">
        ${btnPrimary(replyMailto, 'Phản hồi khách hàng')}
      </p>
    </td>
  </tr>`;

  return baseWrapper(content, `[Website] ${typeLabel} - ${data.name}`);
}

export function wrapOutgoingEmail(bodyHtml: string, subject?: string): string {
  const inner = bodyHtml.trim()
    ? `<td style="padding: 28px 40px; font-size: 15px; line-height: 1.65; color: ${TEXT_COLOR};">${bodyHtml}</td>`
    : `<td style="padding: 28px 40px; font-size: 15px; color: ${TEXT_MUTED};">(Không có nội dung)</td>`;

  const content = `
  ${headerSection(subject ?? 'Thông tin từ Chinese Center')}
  <tr>
    ${inner}
  </tr>
  <tr>
    <td style="padding: 24px 40px; background-color: ${BG_SOFT}; border-top: 1px solid ${BORDER_COLOR};">
      <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED};">
        Email này được gửi từ ${BRAND_NAME}. Nếu có thắc mắc, vui lòng reply trực tiếp.
      </p>
    </td>
  </tr>`;

  return baseWrapper(content, subject ?? undefined);
}

export function textToSimpleHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `<p style="margin: 0 0 12px; white-space: pre-wrap;">${escaped}</p>`;
}

// --------------- Đăng ký học thử: Duyệt (gửi cho học viên) ---------------

export function trialApprovedEmail(params: {
  websiteUrl: string;
  courseName: string;
  courseSlug: string;
  email: string;
  password: string;
  hours: number;
}): { subject: string; html: string; text: string } {
  const { websiteUrl, courseName, courseSlug, email, password, hours } = params;
  const courseLink = `${websiteUrl.replace(/\/$/, '')}/khoa-hoc/${courseSlug}`;
  const safeName = escapeHtml(courseName);
  const subject = `[Chinese Center] Tài khoản học thử - ${courseName}`;
  const text = [
    `Xin chào,`,
    ``,
    `Yêu cầu học thử khóa "${courseName}" của bạn đã được duyệt.`,
    ``,
    `Thông tin đăng nhập:`,
    `  Email: ${email}`,
    `  Mật khẩu: ${password}`,
    ``,
    `Thời hạn: ${hours} giờ. Sau đó tài khoản tạm sẽ bị khóa.`,
    ``,
    `Truy cập khóa học: ${courseLink}`,
    ``,
    BRAND_NAME,
  ].join('\n');

  const html = `
  ${headerSection('Tài khoản học thử đã được kích hoạt', { text: `${hours} giờ` })}
  <tr><td style="padding: 32px 40px 40px;">
    <p style="margin: 0 0 24px; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Xin chào,<br><br>
      Yêu cầu học thử khóa <strong>${safeName}</strong> của bạn đã được duyệt. Bạn có thể đăng nhập và trải nghiệm nội dung khóa trong thời hạn <strong>${hours} giờ</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BG_SOFT}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED};">Tài khoản (email)</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${PRIMARY_COLOR}; word-break: break-all;">${escapeHtml(email)}</p>
          <p style="margin: 16px 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED};">Mật khẩu</p>
          <p style="margin: 4px 0 0; font-size: 15px; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 0.08em; color: ${TEXT_COLOR};">${escapeHtml(password)}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 13px; color: ${TEXT_MUTED};">
      Sau ${hours} giờ, tài khoản tạm sẽ bị khóa. Để học tiếp, vui lòng liên hệ đăng ký mua khóa học.
    </p>
    <p style="margin: 0;">
      ${btnPrimary(courseLink, 'Vào khóa học ngay')}
    </p>
  </td></tr>`;
  return { subject, html: baseWrapper(html, subject), text };
}

// --------------- Học thử: Thu hồi (tài khoản đã xóa) ---------------

export function trialDeactivatedEmail(params: { websiteUrl: string }): { subject: string; html: string; text: string } {
  const contactLink = `${params.websiteUrl.replace(/\/$/, '')}/lien-he`;
  const subject = '[Chinese Center] Tài khoản học thử đã bị xóa';
  const text = [
    `Xin chào,`,
    ``,
    `Tài khoản học thử của bạn đã bị xóa khỏi hệ thống.`,
    ``,
    `Nếu đây là nhầm lẫn hoặc bạn cần phản ánh, vui lòng liên hệ với chúng tôi.`,
    ``,
    `Liên hệ: ${contactLink}`,
    ``,
    BRAND_NAME,
  ].join('\n');
  const html = `
  ${headerSection('Tài khoản đã bị xóa', { text: 'Thông báo', bg: '#fef3c7', color: '#92400e' })}
  <tr><td style="padding: 32px 40px 40px;">
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Xin chào,
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Tài khoản học thử của bạn đã bị xóa khỏi hệ thống.
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Nếu bạn cho rằng đây là nhầm lẫn hoặc cần phản ánh, vui lòng liên hệ với chúng tôi qua link bên dưới.
    </p>
    <p style="margin: 0;">
      ${btnPrimary(contactLink, 'Liên hệ phản ánh')}
    </p>
  </td></tr>`;
  return { subject, html: baseWrapper(html, subject), text };
}

// --------------- Đăng ký lớp: Thông báo CRM (1 mail trong học thử) ---------------

export function classRegistrationNotificationToCrm(data: {
  className: string;
  classDate: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  crmUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `[CRM] Đăng ký lớp mới: ${data.className} - ${data.fullName}`;
  const rows = [
    row('Lớp', escapeHtml(data.className), true),
    data.classDate ? row('Ngày học', data.classDate, false) : '',
    row('Họ tên', escapeHtml(data.fullName)),
    row('Email', `<a href="mailto:${escapeHtml(data.email)}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${escapeHtml(data.email)}</a>`),
    data.phone ? row('SĐT', `<a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a>`) : '',
    data.message ? row('Lời nhắn', nl2br(escapeHtml(data.message))) : '',
  ].filter(Boolean).join('');
  const content = `
  ${headerSection('Đăng ký lớp mới từ website', { text: 'Học thử', bg: '#d1fae5', color: '#065f46' })}
  ${rows}
  <tr>
    <td style="padding: 28px 40px 36px; background-color: ${BG_SOFT}; border-top: 1px solid ${BORDER_COLOR};">
      <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_MUTED};">Vào CRM để duyệt và tạo tài khoản, thêm vào lớp.</p>
      <p style="margin: 0;">${btnPrimary(data.crmUrl, 'Mở CRM - Học thử')}</p>
    </td>
  </tr>`;
  const html = baseWrapper(content, subject);
  const text = [
    `Đăng ký lớp: ${data.className}`,
    data.classDate ? `Ngày học: ${data.classDate}` : '',
    `Họ tên: ${data.fullName}`,
    `Email: ${data.email}`,
    data.phone ? `SĐT: ${data.phone}` : '',
    data.message ? `Lời nhắn: ${data.message}` : '',
    `CRM: ${data.crmUrl}`,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

// --------------- Đăng ký lớp: Duyệt → gửi mail cho người đăng ký (tên, email, SĐT, lớp, lịch, GV, phòng, link lịch) ---------------

export function classRegistrationApprovedEmail(params: {
  fullName: string;
  email: string;
  phone: string;
  className: string;
  scheduleText: string;
  teacherName: string;
  room: string;
  scheduleUrl: string;
  /** Chỉ có khi vừa tạo tài khoản mới (gửi để đăng nhập) */
  password?: string;
}): { subject: string; html: string; text: string } {
  const { fullName, email, phone, className, scheduleText, teacherName, room, scheduleUrl, password } = params;
  const subject = `[Chinese Center] Đăng ký lớp "${className}" đã được duyệt`;
  const rows = [
    row('Họ tên', escapeHtml(fullName), true),
    row('Email', escapeHtml(email)),
    phone ? row('Số điện thoại', escapeHtml(phone)) : '',
    row('Lớp học', escapeHtml(className)),
    row('Thời gian học', escapeHtml(scheduleText)),
    row('Giảng viên', escapeHtml(teacherName)),
    room ? row('Phòng học', escapeHtml(room)) : '',
  ].filter(Boolean).join('');
  const passwordBlock = password
    ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BG_SOFT}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED};">Thông tin đăng nhập</p>
          <p style="margin: 4px 0 0; font-size: 15px; color: ${TEXT_COLOR};">Email: <strong>${escapeHtml(email)}</strong></p>
          <p style="margin: 8px 0 0; font-size: 15px; color: ${TEXT_COLOR};">Mật khẩu: <strong style="font-family: monospace;">${escapeHtml(password)}</strong></p>
        </td>
      </tr>
    </table>`
    : '';
  const content = `
  ${headerSection('Đăng ký lớp đã được duyệt', { text: className, bg: '#d1fae5', color: '#065f46' })}
  <tr><td style="padding: 24px 40px 32px;">
    <p style="margin: 0 0 20px; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">Xin chào ${escapeHtml(fullName)},</p>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">Đăng ký lớp của bạn đã được duyệt. Thông tin như sau:</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin: 16px 0;">
      ${rows}
    </table>
    ${passwordBlock}
    <p style="margin: 24px 0 0; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">Xem lịch học và thông tin lớp tại link bên dưới.</p>
    <p style="margin: 20px 0 0;">${btnPrimary(scheduleUrl, 'Xem lịch học')}</p>
  </td></tr>`;
  const html = baseWrapper(content, subject);
  const text = [
    `Xin chào ${fullName},`,
    ``,
    `Đăng ký lớp của bạn đã được duyệt.`,
    ``,
    `Họ tên: ${fullName}`,
    `Email: ${email}`,
    phone ? `Số điện thoại: ${phone}` : '',
    `Lớp học: ${className}`,
    `Thời gian học: ${scheduleText}`,
    `Giảng viên: ${teacherName}`,
    room ? `Phòng học: ${room}` : '',
    ``,
    password ? `Thông tin đăng nhập: Email: ${email} | Mật khẩu: ${password}` : '',
    ``,
    `Xem lịch học: ${scheduleUrl}`,
    ``,
    BRAND_NAME,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

// --------------- Đăng ký lớp (Trial): Duyệt → gửi tài khoản cho học viên ---------------

export function classTrialApprovedEmail(params: {
  websiteUrl: string;
  className: string;
  classDate?: string | null;
  email: string;
  password: string;
  hours: number;
}): { subject: string; html: string; text: string } {
  const { websiteUrl, className, classDate, email, password, hours } = params;
  const scheduleLink = `${websiteUrl.replace(/\/$/, '')}/lich-hoc`;
  const safeName = escapeHtml(className);
  const dateStr = classDate ? ` (${classDate})` : '';
  const subject = `[Chinese Center] Tài khoản học thử - Lớp ${className}`;
  const text = [
    `Xin chào,`,
    ``,
    `Đăng ký lớp "${className}"${dateStr} của bạn đã được duyệt. Bạn đã được thêm vào lớp.`,
    ``,
    `Thông tin đăng nhập:`,
    `  Email: ${email}`,
    `  Mật khẩu: ${password}`,
    ``,
    `Thời hạn tài khoản: ${hours} giờ.`,
    ``,
    `Xem lịch học: ${scheduleLink}`,
    ``,
    BRAND_NAME,
  ].join('\n');
  const html = `
  ${headerSection('Đã thêm bạn vào lớp', { text: `${hours} giờ` })}
  <tr><td style="padding: 32px 40px 40px;">
    <p style="margin: 0 0 24px; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Xin chào,<br><br>
      Đăng ký lớp <strong>${safeName}</strong>${classDate ? ` (${escapeHtml(classDate)})` : ''} của bạn đã được duyệt. Bạn đã được thêm vào lớp và có thể đăng nhập trong thời hạn <strong>${hours} giờ</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BG_SOFT}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED};">Tài khoản (email)</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${PRIMARY_COLOR}; word-break: break-all;">${escapeHtml(email)}</p>
          <p style="margin: 16px 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED};">Mật khẩu</p>
          <p style="margin: 4px 0 0; font-size: 15px; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 0.08em; color: ${TEXT_COLOR};">${escapeHtml(password)}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 13px; color: ${TEXT_MUTED};">Sau ${hours} giờ tài khoản tạm sẽ bị khóa.</p>
    <p style="margin: 0;">${btnPrimary(scheduleLink, 'Xem lịch học')}</p>
  </td></tr>`;
  return { subject, html: baseWrapper(html, subject), text };
}

// --------------- Học thử: Từ chối (email đã dùng học thử) ---------------

export function trialRejectedAlreadyUsedEmail(params: { websiteUrl: string }): { subject: string; html: string; text: string } {
  const contactLink = `${params.websiteUrl.replace(/\/$/, '')}/lien-he`;
  const subject = '[Chinese Center] Về đăng ký học thử';
  const text = [
    `Xin chào,`,
    ``,
    `Email của bạn đã từng được sử dụng để đăng ký học thử trên website Chinese Center.`,
    ``,
    `Theo chính sách, mỗi người chỉ được học thử một lần. Để tiếp tục học, vui lòng đăng ký mua khóa học. Chúng tôi sẵn sàng tư vấn.`,
    ``,
    `Liên hệ: ${contactLink}`,
    ``,
    BRAND_NAME,
  ].join('\n');
  const html = `
  ${headerSection('Về đăng ký học thử', { text: 'Thông báo', bg: '#fef3c7', color: '#92400e' })}
  <tr><td style="padding: 32px 40px 40px;">
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Xin chào,
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Cảm ơn bạn đã quan tâm. Email của bạn đã từng được sử dụng để đăng ký học thử trên website Chinese Center.
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6;">
      Theo chính sách, mỗi người chỉ được học thử <strong>một lần</strong>. Để tiếp tục học hoặc đăng ký mua khóa, vui lòng liên hệ với chúng tôi — đội ngũ tư vấn sẵn sàng hỗ trợ bạn.
    </p>
    <p style="margin: 0;">
      ${btnPrimary(contactLink, 'Liên hệ tư vấn')}
    </p>
  </td></tr>`;
  return { subject, html: baseWrapper(html, subject), text };
}
