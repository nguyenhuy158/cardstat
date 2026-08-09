-- Chống nhập trùng khi upload lại đúng sao kê: khoá tự nhiên
-- (user_id, date, description, amount) không đủ vì sao kê chỉ có ngày (không có
-- giờ), nên hai giao dịch thật giống nhau trong cùng ngày (ví dụ 2 ly cà phê
-- cùng quán, cùng giá) là chuyện bình thường và không được gộp lại — mất dữ
-- liệu mà người dùng sẽ không nhận ra. Thêm `dup_index` là số thứ tự lần xuất
-- hiện của bộ ba (date, description, amount) giống nhau trong phạm vi user:
-- lần 1 -> 1, lần 2 -> 2, ... Khi đó UNIQUE(user_id, date, description, amount,
-- dup_index) vừa chặn được việc nhập lại toàn bộ sao kê cũ (mọi dòng đều trùng
-- key cũ) vừa giữ được các giao dịch trùng thật trong cùng một lần nhập.

-- Bước 1: thêm cột, mặc định 1 cho các dòng sẽ backfill ngay dưới đây.
ALTER TABLE cardstat_transactions ADD COLUMN dup_index INTEGER NOT NULL DEFAULT 1;

-- Bước 2: backfill dữ liệu cũ. Dùng window function ROW_NUMBER() để đánh số
-- thứ tự các dòng trùng (user_id, date, description, amount) theo id tăng dần
-- — đảm bảo mỗi dòng có dup_index riêng biệt trong nhóm của nó, để bước tạo
-- UNIQUE index ở dưới không bao giờ thất bại vì dữ liệu cũ đã có trùng lặp
-- (ví dụ user "huy" đã nhập file.thang.3.pdf và có các dòng lặp).
UPDATE cardstat_transactions
SET dup_index = (
  SELECT w.rn
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, date, description, amount ORDER BY id
    ) AS rn
    FROM cardstat_transactions
  ) w
  WHERE w.id = cardstat_transactions.id
);

-- Bước 3: tạo UNIQUE index sau khi đã backfill, nên chắc chắn không xung đột.
CREATE UNIQUE INDEX IF NOT EXISTS cardstat_transactions_dedupe_idx
  ON cardstat_transactions (user_id, date, description, amount, dup_index);
