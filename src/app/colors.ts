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

export const SERIES_COLORS = {
  spend: "#dc2626",
  income: "#0d9488",
};
