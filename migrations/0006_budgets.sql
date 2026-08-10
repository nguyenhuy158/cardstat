-- Ngân sách/tháng theo từng danh mục, người dùng tự đặt. Khác với
-- "Cảnh báo danh mục" ở insights (so với trung bình các tháng trước), bảng
-- này so với một hạn mức cố định do chính người dùng chọn.
CREATE TABLE IF NOT EXISTS cardstat_budgets (
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, category)
);
