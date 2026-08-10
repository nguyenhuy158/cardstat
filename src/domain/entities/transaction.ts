export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  source_file: string | null;
  dup_index: number;
  created_at: string;
};

export type NewTransaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
  source_file?: string | null;
};

/** Kết quả nhập một sao kê: bao nhiêu dòng mới, bao nhiêu bị bỏ vì đã tồn tại. */
export type ImportResult = {
  inserted: number;
  skipped: number;
};

export type TransactionUpdate = Partial<Pick<Transaction, "date" | "description" | "amount" | "category">>;

export type TransactionFilter = {
  month?: string | null;
  category?: string | null;
};

export type CategoryTotal = { category: string; total: number };
export type MonthTotal = { month: string; spend: number; income: number };
/** Tổng tiền đã trả vào thẻ (danh mục "Thanh toán thẻ", amount > 0) của một tháng. */
export type CardPaymentMonth = { month: string; total: number };
export type Stats = {
  byCategory: CategoryTotal[];
  byMonth: MonthTotal[];
  cardPaymentsByMonth: CardPaymentMonth[];
  totals: { totalSpend: number; totalIncome: number; count: number };
  months: { month: string }[];
  categories: { category: string }[];
};

/** Một kỳ trả góp đã ghi nhận, gộp từ các dòng "Trả góp" có cùng chuỗi mô tả gốc. */
export type InstallmentPlan = {
  /** Mô tả gốc đã bỏ số kỳ (VD "TRA GOP IPHONE 3/6" -> "TRA GOP IPHONE"), dùng làm key gộp nhóm. */
  key: string;
  description: string;
  monthlyAmount: number;
  paidInstallments: number;
  /** Tổng số kỳ nếu mô tả có ghi rõ dạng "x/y"; null nếu không suy ra được. */
  totalInstallments: number | null;
  firstDate: string;
  lastDate: string;
  paidTotal: number;
};

export type CategoryAlert = {
  category: string;
  currentMonthTotal: number;
  averagePastMonths: number;
  changeRatio: number;
};

export type Insights = {
  predictedNextMonthSpend: number;
  categoryAlerts: CategoryAlert[];
  installmentPlans: InstallmentPlan[];
};

/** Ngân sách/tháng người dùng tự đặt cho một danh mục, kèm chi tiêu tháng hiện tại. */
export type BudgetWithSpend = {
  category: string;
  monthlyLimit: number;
  currentMonthSpend: number;
};
