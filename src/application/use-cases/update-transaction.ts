import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import type { TransactionUpdate } from "@/domain/entities/transaction";
import { isCategory } from "@/domain/services/categorize";

export class NoFieldsToUpdateError extends Error {}
export class InvalidUpdateError extends Error {}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lọc và kiểm tra body thô từ HTTP trước khi cho xuống repository. Repository
 * chỉ ghi bốn cột cố định nên không có chuyện đổi được tên cột, nhưng giá trị
 * thì vẫn đi thẳng vào `bind()` — object/NaN sẽ nổ ở tầng D1 với lỗi khó hiểu,
 * còn danh mục lạ thì lọt vào DB và biểu đồ không có màu cho nó.
 */
export function parseTransactionUpdate(raw: unknown): TransactionUpdate {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new InvalidUpdateError("Dữ liệu cập nhật không hợp lệ");
  }
  const input = raw as Record<string, unknown>;
  const update: TransactionUpdate = {};

  if (input.date !== undefined) {
    if (typeof input.date !== "string" || !DATE_PATTERN.test(input.date)) {
      throw new InvalidUpdateError("Ngày phải có dạng YYYY-MM-DD");
    }
    update.date = input.date;
  }
  if (input.description !== undefined) {
    if (typeof input.description !== "string" || input.description.trim() === "") {
      throw new InvalidUpdateError("Mô tả không được để trống");
    }
    update.description = input.description.trim();
  }
  if (input.amount !== undefined) {
    if (typeof input.amount !== "number" || !Number.isFinite(input.amount)) {
      throw new InvalidUpdateError("Số tiền phải là số");
    }
    update.amount = input.amount;
  }
  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !isCategory(input.category)) {
      throw new InvalidUpdateError("Danh mục không hợp lệ");
    }
    update.category = input.category;
  }

  // Body chỉ toàn khoá lạ cũng rơi vào đây: repository sẽ dựng câu `SET` rỗng
  // và lỗi cú pháp SQL, nên chặn ngay từ đây.
  if (Object.keys(update).length === 0) {
    throw new NoFieldsToUpdateError("Không có gì để cập nhật");
  }
  return update;
}

export async function updateTransaction(repo: TransactionRepository, id: number, raw: unknown) {
  await repo.update(id, parseTransactionUpdate(raw));
}
