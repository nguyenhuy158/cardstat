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

/**
 * Adapter khoá theo một user: `userId` nằm ở constructor chứ không phải tham số
 * của từng method, nên không có đường nào gọi được mà quên lọc. `update`/`delete`
 * cũng có `user_id = ?` trong WHERE — kiểm tra quyền trước rồi mới ghi thì vẫn
 * hở, ở đây điều kiện nằm ngay trong câu lệnh ghi.
 */
export class D1TransactionRepository implements TransactionRepository {
  constructor(
    private readonly db: D1Database,
    private readonly userId: string,
  ) {}

  async list(filter: TransactionFilter): Promise<Transaction[]> {
    let query = "SELECT * FROM cardstat_transactions WHERE user_id = ?";
    const params: (string | number)[] = [this.userId];
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
      .prepare(
        `INSERT INTO cardstat_transactions (date, description, amount, category, user_id) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(input.date, input.description, input.amount, input.category, this.userId)
      .run();
    return info.meta.last_row_id;
  }

  async createMany(inputs: NewTransaction[]): Promise<number> {
    const insert = this.db.prepare(
      `INSERT INTO cardstat_transactions (date, description, amount, category, source_file, user_id) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const batch = inputs.map((r) =>
      insert.bind(r.date, r.description, r.amount, r.category, r.source_file ?? null, this.userId)
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
    values.push(id, this.userId);
    await this.db
      .prepare(`UPDATE cardstat_transactions SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`)
      .bind(...values)
      .run();
  }

  async delete(id: number): Promise<void> {
    await this.db
      .prepare("DELETE FROM cardstat_transactions WHERE id = ? AND user_id = ?")
      .bind(id, this.userId)
      .run();
  }

  async getStats(): Promise<Stats> {
    const [byCategory, byMonth, totals, months, categories] = await Promise.all([
      this.db
        .prepare(
          `SELECT category, SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as total
           FROM cardstat_transactions WHERE user_id = ? GROUP BY category ORDER BY total DESC`
        )
        .bind(this.userId)
        .all<CategoryTotal>(),
      this.db
        .prepare(
          `SELECT substr(date, 1, 7) as month,
                  SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as spend,
                  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income
           FROM cardstat_transactions WHERE user_id = ? GROUP BY month ORDER BY month ASC`
        )
        .bind(this.userId)
        .all<MonthTotal>(),
      this.db
        .prepare(
          `SELECT
            SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as totalSpend,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIncome,
            COUNT(*) as count
           FROM cardstat_transactions WHERE user_id = ?`
        )
        .bind(this.userId)
        .first<Stats["totals"]>(),
      this.db
        .prepare(
          `SELECT DISTINCT substr(date, 1, 7) as month FROM cardstat_transactions WHERE user_id = ? ORDER BY month DESC`
        )
        .bind(this.userId)
        .all<{ month: string }>(),
      this.db
        .prepare(
          `SELECT DISTINCT category FROM cardstat_transactions WHERE user_id = ? ORDER BY category ASC`
        )
        .bind(this.userId)
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
