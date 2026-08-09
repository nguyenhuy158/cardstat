-- Lịch sử nhập sao kê: mỗi lần upload là một dòng có mốc thời gian, và các
-- giao dịch sinh ra từ lần đó trỏ về nó qua `upload_id` — xóa một lần nhập là
-- xóa đúng những giao dịch của nó, không phải dò lại theo tên file.

CREATE TABLE IF NOT EXISTS cardstat_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Số dòng bị bỏ vì trùng: là sự thật về file tại thời điểm nhập, không đổi
  -- về sau. Ngược lại số giao dịch KHÔNG lưu ở đây — xóa lẻ một dòng ở trang
  -- Giao dịch sẽ làm con số lưu sẵn lệch đi, nên đếm live bằng COUNT khi liệt kê.
  skipped_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS cardstat_uploads_user_idx
  ON cardstat_uploads (user_id, uploaded_at DESC);

-- Không khai báo FOREIGN KEY: mức độ enforce của D1 không chắc chắn, mà nếu
-- không enforce thì ON DELETE CASCADE sẽ âm thầm để lại giao dịch mồ côi. Xóa
-- được làm bằng hai câu lệnh tường minh trong cùng một batch, đúng dù pragma
-- foreign_keys bật hay tắt.
ALTER TABLE cardstat_transactions ADD COLUMN upload_id INTEGER;

CREATE INDEX IF NOT EXISTS cardstat_transactions_upload_idx
  ON cardstat_transactions (user_id, upload_id);

-- Backfill dữ liệu cũ: gom theo (user_id, source_file), KHÔNG kèm created_at.
-- `created_at` mặc định `datetime('now')` chỉ chính xác tới giây, nên một batch
-- insert dài có thể vắt qua ranh giới giây và tách một lần nhập thật thành hai
-- dòng lịch sử — nhìn như dữ liệu hỏng. Gom theo tên file chỉ có thể gộp dư
-- (nhập cùng một file hai lần, mà lần sau gần như rỗng vì dedupe), không bao
-- giờ tách nhầm. Mốc thời gian lấy MIN(created_at) — lần ghi đầu tiên.
INSERT INTO cardstat_uploads (user_id, filename, uploaded_at)
SELECT user_id, source_file, MIN(created_at)
FROM cardstat_transactions
WHERE source_file IS NOT NULL
GROUP BY user_id, source_file;

-- Giao dịch tạo tay (POST /api/transactions) có source_file NULL: giữ
-- upload_id NULL, không thuộc lần nhập nào và không hiện trong lịch sử.
UPDATE cardstat_transactions
SET upload_id = (
  SELECT u.id FROM cardstat_uploads u
  WHERE u.user_id = cardstat_transactions.user_id
    AND u.filename = cardstat_transactions.source_file
)
WHERE source_file IS NOT NULL;
