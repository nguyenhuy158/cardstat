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

## Đăng nhập

Mỗi tài khoản chỉ thấy giao dịch của chính mình — mọi route `/api` đòi session,
và mọi câu lệnh SQL đều lọc theo `user_id`.

Chuẩn bị lần đầu:

```bash
cp .dev.vars.example .dev.vars
# điền BETTER_AUTH_SECRET, sinh bằng: openssl rand -base64 32
pnpm exec wrangler d1 migrations apply db --local
```

Vào `/login` để đăng ký tài khoản (username + mật khẩu ≥ 8 ký tự).

Các script CLI (`pnpm upload/stats/tx`) cũng phải đăng nhập, lấy thông tin từ env:

```bash
CARDSTAT_USER=... CARDSTAT_PASS=... pnpm upload file.pdf
```

Khi deploy: `pnpm exec wrangler secret put BETTER_AUTH_SECRET` và chạy migration
với `--remote`.

### Đăng nhập Google (tuỳ chọn)

Nút "Tiếp tục với Google" chỉ hiện khi có đủ **CẢ HAI** biến `GOOGLE_CLIENT_ID`
và `GOOGLE_CLIENT_SECRET` (xem `src/app/login/page.tsx`) — thiếu một trong hai
thì nút bị ẩn hoàn toàn, tránh việc bấm vào chỉ nhận lỗi từ Google.

Tạo OAuth client trên [Google Cloud Console](https://console.cloud.google.com/):

1. Chọn hoặc tạo một project.
2. **APIs & Services → OAuth consent screen**: cấu hình tên app, email hỗ trợ
   (User type "External" nếu không dùng Google Workspace nội bộ).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   Application type chọn **Web application**.
4. **Authorized JavaScript origins** (chỉ origin, không có path):
   - `http://localhost:3000` (dev)
   - `https://<domain-production-của-bạn>` (khi đã deploy)
5. **Authorized redirect URIs** (đúng path callback của better-auth,
   `{basePath}/callback/google` với `basePath = "/api/auth"`):
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://<domain-production-của-bạn>/api/auth/callback/google` (production)
6. Lưu lại — Google trả về **Client ID** và **Client secret**.

Điền giá trị vừa tạo:

- **Local**: mở `.dev.vars` (copy từ `.dev.vars.example`), điền vào
  `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`. File này không commit lên git.
- **Deploy**: KHÔNG đặt secret production trong `.dev.vars`, dùng wrangler:

  ```bash
  pnpm exec wrangler secret put GOOGLE_CLIENT_ID
  pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
  ```

Lưu ý về tài khoản: user đăng nhập bằng Google được tạo với `email` thật lấy
từ Google (khác với `<username>@cardstat.local` của tài khoản username/mật
khẩu), và cột `username` của user đó là **NULL** — không đăng nhập được bằng
username/mật khẩu hay CLI (`CARDSTAT_USER`/`CARDSTAT_PASS`) cho tới khi có
tính năng liên kết tài khoản. Nếu một người đã có tài khoản username/mật khẩu
rồi bấm "Tiếp tục với Google" bằng đúng email Gmail đó, hệ thống **không tự
gộp** hai tài khoản — sẽ có 2 user riêng biệt trong DB.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- React + Tailwind CSS
- SQLite (`node:sqlite`) cho lưu trữ dữ liệu
- [PapaParse](https://www.papaparse.com/) cho parse CSV
