CREATE TABLE IF NOT EXISTS cct_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'Khác',
  source_file TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
