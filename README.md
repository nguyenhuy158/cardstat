# cardstat

Ứng dụng theo dõi chi tiêu thẻ tín dụng: import sao kê CSV, tự động phân loại giao dịch và xem thống kê chi tiêu.

## Tính năng

- Import sao kê ngân hàng dạng CSV (tự nhận diện cột ngày / mô tả / số tiền hoặc ghi nợ-ghi có, tên cột tiếng Anh hoặc tiếng Việt)
- Tự động phân loại giao dịch vào các danh mục (Ăn uống, Di chuyển, Mua sắm, Giải trí, Hóa đơn, Du lịch, Sức khỏe, Rút tiền / Phí, Khác)
- Lịch sử nhập: mỗi lần upload là một dòng có mốc thời gian, xóa một lần nhập
  là xóa đúng các giao dịch của lần đó (giao dịch trùng giữa hai lần nhập tính
  cho lần nhập đầu, nên xóa lần cũ sẽ xóa luôn những dòng đó)
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

## Đăng nhập (SSO)

Toàn bộ trang và API nằm sau cookie SSO `huyab_sso` do
[auth.huyab.click](https://auth.huyab.click) phát hành — cùng một lần đăng nhập
dùng chung với các app khác trên domain. App này chỉ giữ khoá công khai lấy từ
JWKS của issuer nên không thể tự phát token cho mình hay cho app khác.

Mỗi tài khoản chỉ thấy giao dịch của chính mình: mọi route `/api` đòi cookie
hợp lệ và mọi câu lệnh SQL đều lọc theo `user_id`.

Các đường liên quan:

- `/login` — một nút "Tiếp tục với Google", trỏ sang `/api/auth/sso`
- `/api/auth/sso` — redirect tới `<issuer>/login?redirect_uri=<origin>/`
- `/api/auth/logout` — redirect tới `<issuer>/logout`; cookie thuộc cả domain
  nên chỉ SSO service xoá được, app không có session riêng để dọn
- `SSO_ISSUER` (vars trong `wrangler.jsonc`, hoặc `.dev.vars` khi chạy local)
  đổi được issuer; mặc định `https://auth.huyab.click`

Hai tầng kiểm tra:

- Layout `(app)` (server component) verify cookie rồi `redirect("/login")` —
  đây là UX, để trình duyệt chưa đăng nhập không thấy trang trống.
- `requireUser()` verify lại trong từng route handler. Ranh giới bảo mật nằm ở
  đây, vì kiểm tra ở tầng render không chặn được request gọi API trực tiếp.

Không dùng `proxy.ts` (middleware): Next 16 chạy proxy trên Node runtime, còn
`@opennextjs/cloudflare` chỉ nhận edge middleware nên build sẽ fail.

Claims SSO được map sang một dòng trong bảng `user` theo **email**
(`resolveUserId` trong `src/infrastructure/auth/session.ts`), vì giao dịch khoá
theo `user_id` nên vẫn cần một id ổn định của riêng app.

Chuẩn bị lần đầu:

```bash
pnpm exec wrangler d1 migrations apply db --local
```

Các script CLI (`pnpm upload/stats/tx`) không tự đăng nhập được (SSO là luồng
OAuth trên trình duyệt) nên phải mang sẵn cookie — copy giá trị cookie
`huyab_sso` từ devtools:

```bash
HUYAB_SSO_COOKIE=... pnpm upload file.pdf
```

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
