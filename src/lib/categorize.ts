const RULES: { category: string; keywords: string[] }[] = [
  { category: "Ăn uống", keywords: ["restaurant", "food", "coffee", "cafe", "highlands", "phuc long", "grab food", "shopeefood", "nha hang", "quan an", "bun", "pho", "an uong"] },
  { category: "Di chuyển", keywords: ["grab", "be car", "taxi", "xăng", "xang", "petrolimex", "gojek", "parking"] },
  { category: "Mua sắm", keywords: ["shopee", "lazada", "tiki", "amazon", "shopping", "mua sam", "big c", "coopmart", "winmart", "aeon"] },
  { category: "Giải trí", keywords: ["netflix", "spotify", "cgv", "lotte cinema", "youtube", "steam", "game"] },
  { category: "Hóa đơn", keywords: ["evn", "dien luc", "electric", "internet", "fpt telecom", "viettel", "vnpt", "hoa don", "invoice", "bill"] },
  { category: "Du lịch", keywords: ["airline", "vietnam airlines", "vietjet", "booking.com", "agoda", "hotel", "khach san"] },
  { category: "Sức khỏe", keywords: ["pharmacy", "hospital", "clinic", "long chau", "benh vien", "nha thuoc"] },
  { category: "Rút tiền / Phí", keywords: ["fee", "phi thuong nien", "interest", "lai suat", "withdrawal", "cash advance"] },
];

export function autoCategorize(description: string): string {
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return "Khác";
}
