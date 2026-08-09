import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import type {
  CategoryTotal,
  MonthTotal,
  NewTransaction,
  Stats,
  Transaction,
  TransactionFilter,
  TransactionUpdate,
} from "@/domain/entities/transaction";

export class D1TransactionRepository implements TransactionRepository {
  constructor(private readonly db: D1Database) {}

  async list(filter: TransactionFilter): Promise<Transaction[]> {
    let query = "SELECT * FROM cct_transactions WHERE 1=1";
    const params: (string | number)[] = [];
    if (filter.month) {
      query += " AND date LIKE ?";
      params.push(`${filter.month}%`);
    }
    if (filter.category) {
      query += " AND category = ?";
      params.push(filter.category);
    }
    query += " ORDER BY date DESC, id DESC";

    const { results } = await this.db.prepare(query).bind(...params).all<Transaction>();
    return results;
  }

  async create(input: NewTransaction): Promise<number> {
    const info = await this.db
      .prepare(`INSERT INTO cct_transactions (date, description, amount, category) VALUES (?, ?, ?, ?)`)
      .bind(input.date, input.description, input.amount, input.category)
      .run();
    return info.meta.last_row_id;
  }

  async createMany(inputs: NewTransaction[]): Promise<number> {
    const insert = this.db.prepare(
      `INSERT INTO cct_transactions (date, description, amount, category, source_file) VALUES (?, ?, ?, ?, ?)`
    );
    const batch = inputs.map((r) =>
      insert.bind(r.date, r.description, r.amount, r.category, r.source_file ?? null)
    );
    await this.db.batch(batch);
    return inputs.length;
  }

  async update(id: number, update: TransactionUpdate): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    for (const key of ["date", "description", "amount", "category"] as const) {
      const value = update[key];
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    values.push(id);
    await this.db.prepare(`UPDATE cct_transactions SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM cct_transactions WHERE id = ?").bind(id).run();
  }

  async getStats(): Promise<Stats> {
    const [byCategory, byMonth, totals, months, categories] = await Promise.all([
      this.db
        .prepare(
          `SELECT category, SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as total
           FROM cct_transactions GROUP BY category ORDER BY total DESC`
        )
        .all<CategoryTotal>(),
      this.db
        .prepare(
          `SELECT substr(date, 1, 7) as month,
                  SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as spend,
                  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
           FROM cct_transactions GROUP BY month ORDER BY month ASC`
        )
        .all<MonthTotal>(),
      this.db
        .prepare(
          `SELECT
            SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as totalSpend,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIncome,
            COUNT(*) as count
           FROM cct_transactions`
        )
        .first<Stats["totals"]>(),
      this.db
        .prepare(`SELECT DISTINCT substr(date, 1, 7) as month FROM cct_transactions ORDER BY month DESC`)
        .all<{ month: string }>(),
      this.db
        .prepare(`SELECT DISTINCT category FROM cct_transactions ORDER BY category ASC`)
        .all<{ category: string }>(),
    ]);

    return {
      byCategory: byCategory.results,
      byMonth: byMonth.results,
      totals: totals ?? { totalSpend: 0, totalIncome: 0, count: 0 },
      months: months.results,
      categories: categories.results,
    };
  }
}
