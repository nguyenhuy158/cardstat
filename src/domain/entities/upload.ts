/**
 * Một lần nhập sao kê. `transaction_count` đếm live lúc liệt kê chứ không lưu
 * sẵn trong bảng: xóa lẻ một giao dịch ở trang Giao dịch sẽ làm con số lưu sẵn
 * lệch, còn `skipped_count` là sự thật cố định về file tại thời điểm nhập.
 */
export type Upload = {
  id: number;
  filename: string;
  uploaded_at: string;
  skipped_count: number;
  transaction_count: number;
};

/** Kết quả xóa một lần nhập: `found` phân biệt 404 với "xóa xong nhưng 0 dòng". */
export type DeleteUploadResult = {
  found: boolean;
  deletedTransactions: number;
};
