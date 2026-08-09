// Categorical palette — validated (light + dark) with the dataviz palette validator:
// lightness band, chroma floor, normal-vision floor and contrast all PASS.
// Adjacent-pair CVD sits in the 6–8 floor band, which is legal here because every
// mark is direct-labeled (category name on the axis, text chip in the table).
// Keep this key order: the CVD check is on adjacent pairs.
export const CATEGORY_COLORS: Record<string, string> = {
  "Di chuyển": "#2563eb",
  "Ăn uống": "#ea580c",
  "Trả góp": "#0d9488",
  "Giải trí": "#9333ea",
  "Sức khỏe": "#15803d",
  "Mua sắm": "#db2777",
  "Hóa đơn": "#a16207",
  "Du lịch": "#0891b2",
  "Rút tiền / Phí": "#dc2626",
  "Thanh toán thẻ": "#4d7c0f",
  // Reserved neutral for the "Other" bucket — never a categorical hue.
  Khác: "#6b7280",
};

// Chữ trắng chỉ đạt AA (4.5:1) trên phần lớn màu trên, nhưng ba màu sáng dưới đây
// chỉ được 3.5–3.7:1 — với chúng phải lật sang mực tối (#18181b đạt 4.7–5.0:1).
// Đổi màu chữ thay vì làm tối màu nền vì cùng bảng màu này còn tô cột biểu đồ và
// đã qua validator (CVD / lightness band); sửa nền là phải kiểm định lại cả bảng.
const DARK_INK_CATEGORIES = new Set(["Ăn uống", "Trả góp", "Du lịch"]);

const FALLBACK_COLOR = CATEGORY_COLORS["Khác"];

/** Nền + màu chữ của chip danh mục, luôn đạt tương phản AA. */
export function categoryChipStyle(category: string) {
  return {
    backgroundColor: CATEGORY_COLORS[category] || FALLBACK_COLOR,
    color: DARK_INK_CATEGORIES.has(category) ? "#18181b" : "#ffffff",
  };
}

export const SERIES_COLORS = {
  spend: "#dc2626",
  income: "#0d9488",
};
