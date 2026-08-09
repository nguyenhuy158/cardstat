import type { ImportResult } from "@/domain/entities/transaction";
import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { parseStatementText } from "@/domain/services/statement-text-parser";

/** Parser không đọc được dòng giao dịch nào từ file (khác với "đọc được nhưng đã nhập trước đó"). */
export class EmptyStatementError extends Error {}

export type PdfTextExtractor = (buffer: ArrayBuffer) => Promise<string>;

export async function importStatement(
  repo: TransactionRepository,
  extractPdfText: PdfTextExtractor,
  pdfBuffer: ArrayBuffer,
  sourceFile: string
): Promise<ImportResult & { uploadId: number }> {
  const text = await extractPdfText(pdfBuffer);
  const rows = parseStatementText(text);
  if (rows.length === 0) {
    throw new EmptyStatementError("Không đọc được giao dịch nào từ file. Kiểm tra lại định dạng PDF sao kê.");
  }

  // Dòng lịch sử phải có trước để lấy id gắn vào từng giao dịch; D1 không có
  // transaction mở kéo dài qua nhiều lượt gọi nên nếu batch insert hỏng thì tự
  // dọn dòng vừa tạo, đừng để lại một lần nhập rỗng không ai giải thích được.
  const uploadId = await repo.createUpload(sourceFile);
  let result;
  try {
    result = await repo.createMany(
      rows.map((r) => ({ ...r, source_file: sourceFile })),
      uploadId
    );
  } catch (err) {
    await repo.deleteUpload(uploadId).catch(() => {});
    throw err;
  }

  // Ngoài try ở trên và tự nuốt lỗi: `deleteUpload` xóa cả giao dịch của lần
  // nhập, nên nếu để câu UPDATE này trong tầm rollback thì một lỗi vặt lúc ghi
  // bộ đếm sẽ xóa mất sao kê vừa nhập thành công. Sai `skipped_count` chỉ là
  // hiển thị lệch một con số.
  await repo.setUploadSkipped(uploadId, result.skipped).catch(() => {});
  return { ...result, uploadId };
}
