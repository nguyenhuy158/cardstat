/**
 * Số dòng mỗi trang của bảng giao dịch. Tách ra module riêng vì cả bảng thật
 * (`transactions-table.tsx`) lẫn skeleton (`skeleton.tsx`) đều cần con số này:
 * skeleton phải vẽ đúng số dòng bảng sắp hiện, không thì đổi từ skeleton sang
 * dữ liệu thật là nhảy layout — đúng thứ skeleton sinh ra để tránh.
 *
 * Không để skeleton import thẳng từ `transactions-table.tsx`: file đó kéo theo
 * cả TanStack Table + Radix Select, mà `layout.tsx` cũng import skeleton, nên
 * import thẳng sẽ nhét bảng vào bundle của mọi trang trong nhóm `(app)`.
 */
export const PAGE_SIZE = 10;
