/**
 * HTML email templates – inline styles for compatibility with major email clients.
 * Max-width 600px, single column, modern and readable.
 */

const BRAND_NAME = 'Chinese Center';
const PRIMARY_COLOR = '#0f766e';
const PRIMARY_LIGHT = '#ccfbf1';
const BORDER_COLOR = '#e5e7eb';
const TEXT_COLOR = '#374151';
const TEXT_MUTED = '#6b7280';

function baseWrapper(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ?? BRAND_NAME}</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; color: ${TEXT_COLOR};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
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

function headerSection(subject: string, badge?: { text: string; bg: string; color: string }): string {
  return `
  <tr>
    <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #115e59 100%);">
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
        ${BRAND_NAME}
      </h1>
      <p style="margin: 12px 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">
        ${subject}
      </p>
      ${badge ? `<span style="display: inline-block; margin-top: 12px; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${badge.bg}; color: ${badge.color};">${badge.text}</span>` : ''}
    </td>
  </tr>`;
}

function row(label: string, value: string, isHighlight = false): string {
  return `
  <tr>
    <td style="padding: 12px 32px; border-bottom: 1px solid ${BORDER_COLOR};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${TEXT_MUTED}; width: 120px; vertical-align: top; padding-top: 2px;">
            ${label}
          </td>
          <td style="font-size: 15px; color: ${isHighlight ? PRIMARY_COLOR : TEXT_COLOR}; font-weight: ${isHighlight ? 600 : 400}; word-break: break-word;">
            ${value}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

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
  const typeLabel = data.type === 'TU_VAN' ? 'Tư vấn (Liên hệ)' : 'Đăng ký học thử';
  const badge = data.type === 'DANG_KY_HOC_THU'
    ? { text: 'Đăng ký học thử', bg: '#d1fae5', color: '#065f46' }
    : { text: 'Tư vấn', bg: '#dbeafe', color: '#1e40af' };

  const rows = [
    row('Họ tên', data.name, true),
    row('Email', `<a href="mailto:${data.email}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${data.email}</a>`),
    row('Điện thoại', `<a href="tel:${data.phone}" style="color: ${TEXT_COLOR}; text-decoration: none;">${data.phone}</a>`),
    data.message ? row('Nội dung', data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')) : '',
    data.courseInterest ? row('Khóa quan tâm', data.courseInterest) : '',
    data.timePreference ? row('Khung giờ', data.timePreference) : '',
    data.note ? row('Ghi chú', data.note.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')) : '',
    row('Thời gian', data.createdAt.toLocaleString('vi-VN')),
  ].filter(Boolean).join('');

  const content = `
  ${headerSection('Đăng ký mới từ website', badge)}
  ${rows}
  <tr>
    <td style="padding: 24px 32px 32px; background-color: #f9fafb;">
      <p style="margin: 0; font-size: 13px; color: ${TEXT_MUTED};">
        Reply trực tiếp email này để phản hồi khách hàng. Hệ thống đã đặt <strong>Reply-To</strong> là địa chỉ email của người gửi.
      </p>
    </td>
  </tr>`;

  return baseWrapper(content, `[Website] ${typeLabel} - ${data.name}`);
}

export function wrapOutgoingEmail(bodyHtml: string, subject?: string): string {
  const inner = bodyHtml.trim()
    ? `<td style="padding: 24px 32px; font-size: 15px; line-height: 1.6; color: ${TEXT_COLOR};">${bodyHtml}</td>`
    : `<td style="padding: 24px 32px; font-size: 15px; color: ${TEXT_MUTED};">(Không có nội dung)</td>`;

  const content = `
  ${headerSection(subject ?? 'Thông tin từ Chinese Center')}
  <tr>
    ${inner}
  </tr>
  <tr>
    <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid ${BORDER_COLOR};">
      <p style="margin: 0; font-size: 12px; color: ${TEXT_MUTED};">
        Email này được gửi từ ${BRAND_NAME}. Nếu bạn có thắc mắc, vui lòng reply trực tiếp.
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
