/** Danh mục các khoản trả nợ vào thẻ — export riêng vì `getStats` cần lọc đúng danh mục này để tính tổng đã trả/tháng. */
export const CARD_PAYMENT_CATEGORY = "Thanh toán thẻ";

const RULES: { category: string; keywords: string[] }[] = [
  { category: "Trả góp", keywords: ["tg ls", "tra gop", "installment", "klk"] },
  { category: CARD_PAYMENT_CATEGORY, keywords: ["vi pay", "vipay", "thanh toan the", "payment received", "napas"] },
  { category: "Ăn uống", keywords: ["restaurant", "food", "coffee", "cafe", "highlands", "phuc long", "grab food", "shopeefood", "nha hang", "quan an", "bun", "pho", "an uong"] },
  { category: "Di chuyển", keywords: ["grab", "be car", "taxi", "xăng", "xang", "petrolimex", "gojek", "parking"] },
  { category: "Mua sắm", keywords: ["shopee", "lazada", "tiki", "amazon", "shopping", "mua sam", "big c", "coopmart", "winmart", "aeon"] },
  { category: "Giải trí", keywords: ["netflix", "spotify", "cgv", "lotte cinema", "youtube", "steam", "game"] },
  { category: "Hóa đơn", keywords: ["evn", "dien luc", "electric", "internet", "fpt telecom", "viettel", "vnpt", "hoa don", "invoice", "bill"] },
  { category: "Du lịch", keywords: ["airline", "vietnam airlines", "vietjet", "booking.com", "agoda", "hotel", "khach san"] },
  { category: "Sức khỏe", keywords: ["pharmacy", "hospital", "clinic", "long chau", "benh vien", "nha thuoc"] },
  { category: "Rút tiền / Phí", keywords: ["fee", "phi thuong nien", "interest", "lai suat", "withdrawal", "cash advance"] },
];

/** Bucket mặc định khi không luật nào khớp — cũng là danh mục hợp lệ khi sửa tay. */
export const OTHER_CATEGORY = "Khác";

/**
 * Tập danh mục hợp lệ: đúng những giá trị `autoCategorize` có thể sinh ra, nên
 * sửa tay không tạo được danh mục lạ mà biểu đồ/bảng màu không biết tô. Dẫn xuất
 * từ `RULES` thay vì liệt kê lại để thêm luật mới là tự có trong danh sách.
 */
export const CATEGORIES: readonly string[] = [...RULES.map((r) => r.category), OTHER_CATEGORY];

export function isCategory(value: string): boolean {
  return CATEGORIES.includes(value);
}

export function autoCategorize(description: string): string {
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return OTHER_CATEGORY;
}
