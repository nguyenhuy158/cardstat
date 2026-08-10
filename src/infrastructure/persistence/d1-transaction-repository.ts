import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import type {
  BudgetWithSpend,
  CardPaymentMonth,
  CategoryTotal,
  ImportResult,
  MonthTotal,
  NewTransaction,
  Stats,
  Transaction,
  TransactionFilter,
  TransactionUpdate,
} from "@/domain/entities/transaction";
import type { DeleteUploadResult, Upload } from "@/domain/entities/upload";
import { CARD_PAYMENT_CATEGORY } from "@/domain/services/categorize";

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

  async createMany(inputs: NewTransaction[], uploadId?: number): Promise<ImportResult> {
    if (inputs.length === 0) return { inserted: 0, skipped: 0 };

    // dup_index = số thứ tự lần xuất hiện của bộ (date, description, amount)
    // TRONG BATCH này, đếm theo thứ tự các dòng trong file, không phụ thuộc
    // dữ liệu đã có sẵn trong DB. Nhờ vậy nhập lại đúng một sao kê sẽ luôn tái
    // tạo đúng dãy dup_index cũ (1, 2, 3, ...) nên va đúng vào UNIQUE index và
    // bị INSERT OR IGNORE bỏ qua toàn bộ; còn hai giao dịch trùng thật trong
    // cùng sao kê (ví dụ 2 ly cà phê cùng quán, cùng giá, cùng ngày) được gán
    // dup_index khác nhau (1 và 2) nên cả hai đều được giữ lại.
    const counters = new Map<string, number>();
    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO cardstat_transactions
         (date, description, amount, category, source_file, user_id, dup_index, upload_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const batch = inputs.map((r) => {
      const key = [r.date, r.description, r.amount].join("|");
      const dupIndex = (counters.get(key) ?? 0) + 1;
      counters.set(key, dupIndex);
      return insert.bind(
        r.date,
        r.description,
        r.amount,
        r.category,
        r.source_file ?? null,
        this.userId,
        dupIndex,
        uploadId ?? null
      );
    });

    // meta.changes trên mỗi kết quả batch phản ánh đúng số dòng thực sự được
    // ghi (0 nếu bị INSERT OR IGNORE bỏ qua do trùng UNIQUE index) — đã kiểm
    // chứng bằng test đếm số dòng trước/sau khi upload trùng lặp thực tế. Nếu
    // D1 thay đổi hành vi này, fallback là đếm COUNT(*) trước/sau thay vì
    // cộng meta.changes.
    const results = await this.db.batch(batch);
    const inserted = results.reduce((sum, r) => sum + (r.meta.changes ?? 0), 0);
    return { inserted, skipped: inputs.length - inserted };
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

  async createUpload(filename: string): Promise<number> {
    const info = await this.db
      .prepare(`INSERT INTO cardstat_uploads (user_id, filename) VALUES (?, ?)`)
      .bind(this.userId, filename)
      .run();
    return info.meta.last_row_id;
  }

  async setUploadSkipped(id: number, skipped: number): Promise<void> {
    await this.db
      .prepare(`UPDATE cardstat_uploads SET skipped_count = ? WHERE id = ? AND user_id = ?`)
      .bind(skipped, id, this.userId)
      .run();
  }

  async listUploads(): Promise<Upload[]> {
    // LEFT JOIN để lần nhập đã bị xóa hết giao dịch vẫn còn trong lịch sử với
    // số 0, thay vì biến mất khỏi danh sách. Điều kiện `t.user_id` nằm trong ON
    // chứ không phải WHERE — WHERE sẽ biến LEFT JOIN thành INNER JOIN.
    const { results } = await this.db
      .prepare(
        `SELECT u.id, u.filename, u.uploaded_at, u.skipped_count,
                COUNT(t.id) AS transaction_count
         FROM cardstat_uploads u
         LEFT JOIN cardstat_transactions t
           ON t.upload_id = u.id AND t.user_id = u.user_id
         WHERE u.user_id = ?
         GROUP BY u.id
         ORDER BY u.uploaded_at DESC, u.id DESC`
      )
      .bind(this.userId)
      .all<Upload>();
    return results;
  }

  async deleteUpload(id: number): Promise<DeleteUploadResult> {
    // Xóa giao dịch trước rồi mới xóa dòng lịch sử: batch của D1 chạy tuần tự
    // trong một transaction nên không có khoảnh khắc giao dịch mồ côi. Cả hai
    // câu đều có `user_id = ?` — không kiểm tra quyền rồi mới ghi.
    const [transactions, upload] = await this.db.batch([
      this.db
        .prepare("DELETE FROM cardstat_transactions WHERE upload_id = ? AND user_id = ?")
        .bind(id, this.userId),
      this.db
        .prepare("DELETE FROM cardstat_uploads WHERE id = ? AND user_id = ?")
        .bind(id, this.userId),
    ]);

    // Không xóa được dòng lịch sử nào = id không tồn tại hoặc của user khác;
    // hai trường hợp đó phải cùng ra 404, không tiết lộ id nào đang tồn tại.
    return {
      found: (upload.meta.changes ?? 0) > 0,
      deletedTransactions: transactions.meta.changes ?? 0,
    };
  }

  async getStats(): Promise<Stats> {
    const [byCategory, byMonth, cardPaymentsByMonth, totals, months, categories] = await Promise.all([
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
      // Riêng danh mục "Thanh toán thẻ", amount > 0: đây là khoản trả nợ vào
      // thẻ, khác với `income` ở byMonth (gồm cả hoàn tiền, chuyển khoản vào
      // linh tinh khác — không phải câu người dùng thật sự muốn hỏi).
      this.db
        .prepare(
          `SELECT substr(date, 1, 7) as month, SUM(amount) as total
           FROM cardstat_transactions
           WHERE user_id = ? AND category = ? AND amount > 0
           GROUP BY month ORDER BY month DESC`
        )
        .bind(this.userId, CARD_PAYMENT_CATEGORY)
        .all<CardPaymentMonth>(),
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
      cardPaymentsByMonth: cardPaymentsByMonth.results,
      totals: totals ?? { totalSpend: 0, totalIncome: 0, count: 0 },
      months: months.results,
      categories: categories.results,
    };
  }

  async getBudgetsWithSpend(month: string): Promise<BudgetWithSpend[]> {
    // FULL OUTER JOIN không có trong SQLite/D1 nên gộp bằng UNION: danh mục
    // có ngân sách nhưng chưa chi tháng này (spend = 0) và danh mục có chi
    // tiêu nhưng chưa đặt ngân sách (monthly_limit = 0) đều phải xuất hiện.
    const { results } = await this.db
      .prepare(
        `SELECT category, monthly_limit as monthlyLimit, currentMonthSpend FROM (
           SELECT b.category as category, b.monthly_limit as monthly_limit,
                  COALESCE((
                    SELECT SUM(-t.amount) FROM cardstat_transactions t
                    WHERE t.user_id = b.user_id AND t.category = b.category
                      AND t.amount < 0 AND substr(t.date, 1, 7) = ?
                  ), 0) as currentMonthSpend
           FROM cardstat_budgets b
           WHERE b.user_id = ?
           UNION
           SELECT t.category as category, 0 as monthly_limit,
                  SUM(-t.amount) as currentMonthSpend
           FROM cardstat_transactions t
           WHERE t.user_id = ? AND t.amount < 0 AND substr(t.date, 1, 7) = ?
             AND t.category NOT IN (SELECT category FROM cardstat_budgets WHERE user_id = ?)
           GROUP BY t.category
         )
         ORDER BY monthlyLimit > 0 DESC, currentMonthSpend DESC`
      )
      .bind(month, this.userId, this.userId, month, this.userId)
      .all<BudgetWithSpend>();
    return results;
  }

  async setBudget(category: string, limit: number): Promise<void> {
    if (limit <= 0) {
      await this.db
        .prepare("DELETE FROM cardstat_budgets WHERE user_id = ? AND category = ?")
        .bind(this.userId, category)
        .run();
      return;
    }

    await this.db
      .prepare(
        `INSERT INTO cardstat_budgets (user_id, category, monthly_limit, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT (user_id, category)
         DO UPDATE SET monthly_limit = excluded.monthly_limit, updated_at = excluded.updated_at`
      )
      .bind(this.userId, category, limit)
      .run();
  }
}
