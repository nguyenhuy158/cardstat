export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  source_file: string | null;
  created_at: string;
};

export type NewTransaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
  source_file?: string | null;
};

export type TransactionUpdate = Partial<Pick<Transaction, "date" | "description" | "amount" | "category">>;

export type TransactionFilter = {
  month?: string | null;
  category?: string | null;
};

export type CategoryTotal = { category: string; total: number };
export type MonthTotal = { month: string; spend: number; income: number };
export type Stats = {
  byCategory: CategoryTotal[];
  byMonth: MonthTotal[];
  totals: { totalSpend: number; totalIncome: number; count: number };
  months: { month: string }[];
  categories: { category: string }[];
};
