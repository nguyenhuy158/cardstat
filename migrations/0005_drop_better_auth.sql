-- Bỏ better-auth, chuyển sang cookie SSO của auth.huyab.click. App không còn
-- giữ session hay mật khẩu nào nữa nên ba bảng này thành rác.
--
-- Bảng `user` GIỮ LẠI: `cardstat_transactions.user_id` và `cardstat_uploads`
-- trỏ vào đó, và phiên SSO vẫn cần một id ổn định của riêng app (xem
-- resolveUserId trong src/infrastructure/auth/session.ts). Hai cột
-- `username`/`display_username` cũng để nguyên — xoá cột trong SQLite phải dựng
-- lại cả bảng, không đáng cho hai cột NULL vô hại.
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS verification;
