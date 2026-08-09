# cardstat

Ứng dụng theo dõi chi tiêu thẻ tín dụng: import sao kê CSV, tự động phân loại giao dịch và xem thống kê chi tiêu.

## Tính năng

- Import sao kê ngân hàng dạng CSV (tự nhận diện cột ngày / mô tả / số tiền hoặc ghi nợ-ghi có, tên cột tiếng Anh hoặc tiếng Việt)
- Tự động phân loại giao dịch vào các danh mục (Ăn uống, Di chuyển, Mua sắm, Giải trí, Hóa đơn, Du lịch, Sức khỏe, Rút tiền / Phí, Khác)
- Dashboard thống kê: tổng chi tiêu/thu nhập, biểu đồ theo danh mục và theo tháng
- Danh sách giao dịch có lọc theo tháng/danh mục, sửa danh mục ngay trên chip
  (phân loại tự động chỉ dò từ khóa nên sẽ có dòng sai) và xóa từng dòng
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

## CI/CD

Deploy production chạy qua **Cloudflare Workers Builds**, đã kết nối thẳng
với repo GitHub và tự deploy mỗi khi có push lên `main` — không cấu hình
trong repo này (không có bước "deploy" trong `.github/workflows/`, để
tránh hai hệ thống deploy cùng lúc). `.github/workflows/ci.yml` chỉ làm ba
việc: kiểm tra trước khi merge/deploy, cảnh báo nếu D1 production còn
migration chưa apply, và smoke test sau khi đã deploy.

### Secret cần thêm ở GitHub (Settings → Secrets and variables → Actions)

Chỉ cần tên bên dưới — **không tự tạo giá trị**, dùng đúng token/ID thật của
bạn:

- `CLOUDFLARE_API_TOKEN` — token có quyền đọc D1 (dùng cho bước kiểm tra
  migration chưa apply trên production; không có secret này thì bước đó tự
  bỏ qua và cảnh báo, không fail cả workflow).
- `CLOUDFLARE_ACCOUNT_ID` — account ID Cloudflare, đi kèm token trên.

### Chạy smoke test tay

```bash
node scripts/smoke.mjs https://cardstats.huyab.click
# hoặc test local:
node scripts/smoke.mjs http://localhost:3000
```

Script kiểm tra `/login` trả 200 và có nội dung tiếng Việt thật, `/api/stats`
**phải** trả 401 khi chưa đăng nhập (assertion quan trọng nhất — nếu route
này trả 200 thì dữ liệu chi tiêu của mọi người đang bị public), và `/` không
lộ số liệu khi chưa có session. Exit code khác 0 nếu có kiểm tra fail.

### Quy trình chạy migration

D1 production **không** tự apply migration khi deploy — Workers Builds chỉ
build và deploy code, không chạy `wrangler d1 migrations apply`. Sau khi
thêm migration mới trong `migrations/`, chạy tay:

```bash
pnpm exec wrangler d1 migrations apply db --remote
```

CI có một job (`migrations-check`) chạy `wrangler d1 migrations list db
--remote` trên mỗi push vào `main` và **fail** nếu còn migration chưa apply,
để không ai vô tình deploy code cần bảng/cột mới mà quên chạy migration.
Job này chỉ cảnh báo (không tự chạy migration, và cũng không chặn được
Workers Builds deploy vì hai hệ thống độc lập, chạy song song trên cùng một
push) — thấy fail thì chạy lệnh trên bằng tay ngay.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- React + Tailwind CSS
- SQLite (`node:sqlite`) cho lưu trữ dữ liệu
- [PapaParse](https://www.papaparse.com/) cho parse CSV
