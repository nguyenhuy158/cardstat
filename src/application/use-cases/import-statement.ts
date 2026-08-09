import type { TransactionRepository } from "@/domain/ports/transaction-repository";
import { parseStatementText } from "@/domain/services/statement-text-parser";

export class EmptyStatementError extends Error {}

export type PdfTextExtractor = (buffer: ArrayBuffer) => Promise<string>;

export async function importStatement(
  repo: TransactionRepository,
  extractPdfText: PdfTextExtractor,
  pdfBuffer: ArrayBuffer,
  sourceFile: string
) {
  const text = await extractPdfText(pdfBuffer);
  const rows = parseStatementText(text);
  if (rows.length === 0) {
    throw new EmptyStatementError("Không đọc được giao dịch nào từ file. Kiểm tra lại định dạng PDF sao kê.");
  }
  const inserted = await repo.createMany(rows.map((r) => ({ ...r, source_file: sourceFile })));
  return inserted;
}
