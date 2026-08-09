# cardstat

Ứng dụng theo dõi chi tiêu thẻ tín dụng: import sao kê CSV, tự động phân loại giao dịch và xem thống kê chi tiêu.

## Tính năng

- Import sao kê ngân hàng dạng CSV (tự nhận diện cột ngày / mô tả / số tiền hoặc ghi nợ-ghi có, tên cột tiếng Anh hoặc tiếng Việt)
- Tự động phân loại giao dịch vào các danh mục (Ăn uống, Di chuyển, Mua sắm, Giải trí, Hóa đơn, Du lịch, Sức khỏe, Rút tiền / Phí, Khác)
- Dashboard thống kê: tổng chi tiêu/thu nhập, biểu đồ theo danh mục và theo tháng
- Danh sách giao dịch có lọc theo tháng/danh mục và xóa từng dòng
- Lưu trữ bằng SQLite (`node:sqlite`), không cần cấu hình database ngoài

## Getting Started

Cài dependencies và chạy dev server:

```bash
pnpm install
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- React + Tailwind CSS
- SQLite (`node:sqlite`) cho lưu trữ dữ liệu
- [PapaParse](https://www.papaparse.com/) cho parse CSV
