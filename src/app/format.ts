// Bộ định dạng ngày/giờ dùng chung theo quy ước Việt Nam (DD/MM/YYYY, 24h).
// Không rải Intl khắp component — mọi nơi cần hiển thị ngày/giờ import từ đây.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const HAS_ZONE_RE = /Z|[+-]\d{2}:?\d{2}$/;

/**
 * "2026-02-10" -> "10/02/2026".
 *
 * Tách chuỗi thủ công, KHÔNG dùng `new Date("2026-02-10")`: chuỗi kiểu này bị
 * parse như UTC midnight, nên với giờ Việt Nam (UTC+7) sẽ hiển thị lùi một
 * ngày (09/02 thay vì 10/02). `date` ở đây là ngày giao dịch thuần, không có
 * giờ, nên không cần quy đổi timezone gì cả.
 */
export function formatDate(date: string): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/**
 * "2026-08-09 07:22:49" (SQLite `datetime('now')`, giờ UTC nhưng không có
 * hậu tố "Z") -> "14:22 09/08/2026" theo giờ Việt Nam.
 *
 * Phải tự thêm "Z" trước khi `new Date(...)`: nếu để nguyên, JS hiểu chuỗi có
 * khoảng trắng (không phải ISO) là giờ LOCAL của máy chạy, mà máy chạy trên
 * Cloudflare Workers là UTC nên sẽ lệch 7 giờ. Sau khi có Date đúng, luôn ép
 * `timeZone: "Asia/Ho_Chi_Minh"` khi format vì runtime deploy không ở giờ VN.
 */
export function formatDateTime(dateTime: string): string {
  const iso = dateTime.includes("T") ? dateTime : dateTime.replace(" ", "T");
  const withZone = HAS_ZONE_RE.test(iso) ? iso : `${iso}Z`;
  const d = new Date(withZone);
  if (Number.isNaN(d.getTime())) return dateTime;

  // `hourCycle: "h23"` để có "07:22" (không AM/PM) và tránh lỗi "24:00" lúc
  // nửa đêm mà "h24" gây ra.
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")} ${get("day")}/${get("month")}/${get("year")}`;
}

/**
 * "2026-02" -> "02/2026". Dùng cho trục tháng trên chart và dropdown lọc
 * tháng — chỉ đổi phần hiển thị, giá trị gốc "YYYY-MM" vẫn phải giữ nguyên ở
 * nơi gửi lên API (query param `month`).
 */
export function formatMonth(month: string): string {
  const m = MONTH_RE.exec(month);
  if (!m) return month;
  const [, y, mo] = m;
  return `${mo}/${y}`;
}
