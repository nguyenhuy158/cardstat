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
): Promise<ImportResult> {
  const text = await extractPdfText(pdfBuffer);
  const rows = parseStatementText(text);
  if (rows.length === 0) {
    throw new EmptyStatementError("Không đọc được giao dịch nào từ file. Kiểm tra lại định dạng PDF sao kê.");
  }
  return repo.createMany(rows.map((r) => ({ ...r, source_file: sourceFile })));
}
