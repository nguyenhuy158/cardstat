import type {
  BudgetWithSpend,
  ImportResult,
  NewTransaction,
  Stats,
  Transaction,
  TransactionFilter,
  TransactionUpdate,
} from "../entities/transaction";
import type { DeleteUploadResult, Upload } from "../entities/upload";

export interface TransactionRepository {
  list(filter: TransactionFilter): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<number>;
  /** `uploadId` gắn các dòng vào một lần nhập để sau này xóa cả cụm. */
  createMany(inputs: NewTransaction[], uploadId?: number): Promise<ImportResult>;
  update(id: number, update: TransactionUpdate): Promise<void>;
  delete(id: number): Promise<void>;
  getStats(): Promise<Stats>;

  /** Tạo dòng lịch sử trước khi insert giao dịch — cần id để gắn vào từng dòng. */
  createUpload(filename: string): Promise<number>;
  setUploadSkipped(id: number, skipped: number): Promise<void>;
  listUploads(): Promise<Upload[]>;
  /** Xóa giao dịch của lần nhập rồi mới xóa dòng lịch sử, trong cùng một batch. */
  deleteUpload(id: number): Promise<DeleteUploadResult>;

  /** `month` dạng "YYYY-MM". Trả về mọi danh mục có ngân sách HOẶC có chi tiêu trong tháng đó. */
  getBudgetsWithSpend(month: string): Promise<BudgetWithSpend[]>;
  /** `limit <= 0` xoá ngân sách của danh mục thay vì lưu số 0. */
  setBudget(category: string, limit: number): Promise<void>;
}
