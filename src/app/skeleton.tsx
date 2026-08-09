"use client";

/**
 * Khối skeleton dùng chung cho các trang tự fetch dữ liệu ở client-side
 * (useEffect + fetch). `loading.tsx`/Suspense của App Router không giúp được
 * ở đây: các trang này không suspend lúc render — component mount ngay, state
 * chỉ đổi sau khi fetch xong — nên phải tự quản lý "đang tải" bằng render có
 * điều kiện, không phải bằng file convention của Next.
 *
 * Kích thước từng khối được khớp tay với nội dung thật (cùng chiều cao, cùng
 * lưới) để lúc dữ liệu vào không bị nhảy layout.
 */

import { PAGE_SIZE } from "./pagination";

/** Khối giữ chỗ thuần trang trí — luôn `aria-hidden`, không mang thông tin gì cho a11y. */
function Block({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

/**
 * Live region báo "đang tải" cho screen reader — tách riêng khỏi các khối
 * trang trí (`aria-hidden`) vì gộp `aria-hidden` lên cả vùng cha sẽ nuốt luôn
 * text này. Luôn đặt bên trong vùng có `aria-busy="true"`, không để trơ một
 * mình khi không có gì đang tải (khác với `role="status"` của `upload/page.tsx`
 * chỉ render khi có `message` — ở đây tương đương: component này chỉ được
 * render khi đang ở nhánh loading).
 */
function LoadingStatus({ label = "Đang tải dữ liệu" }: { label?: string }) {
  return (
    <span role="status" className="sr-only">
      {label}
    </span>
  );
}

/** Trang "Tổng quan" — khớp lưới 3 thẻ thật (`grid-cols-2 sm:grid-cols-3`, thẻ 3 chiếm 2 cột ở mobile). */
export function OverviewSkeleton() {
  return (
    <section aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <LoadingStatus />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 ${
            i === 2 ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <Block className="h-3 w-20 sm:h-4 sm:w-28" />
          <Block className="mt-2 h-5 w-24 sm:h-7 sm:w-32" />
        </div>
      ))}
    </section>
  );
}

/**
 * Trang "Biểu đồ" — tiêu đề thẻ giữ nguyên chữ thật (nội dung tĩnh, không phụ
 * thuộc dữ liệu), chỉ vùng vẽ biểu đồ là khối skeleton, đúng `h-72 sm:h-64`
 * (danh mục) và `h-56 sm:h-64` (theo tháng) như `charts.tsx` thật — tiện thể
 * sửa luôn lỗi nhảy layout cũ (card không có chiều cao cố định lúc `stats`
 * còn null).
 */
export function ChartsSkeleton() {
  return (
    <section aria-busy="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LoadingStatus />
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Chi tiêu theo danh mục</h2>
        <Block className="h-72 w-full sm:h-64" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Chi tiêu và thu theo tháng</h2>
        <Block className="h-56 w-full sm:h-64" />
      </div>
    </section>
  );
}

/**
 * Nội dung bảng "Giao dịch" lúc đang tải — thay cho `<TransactionsTable>`
 * (component không thuộc sở hữu, không sửa trực tiếp được) bằng một khối
 * cùng khung: toolbar (tìm kiếm + 2 select), dãy nút sắp xếp mobile, danh
 * sách card mobile, bảng desktop.
 *
 * Số dòng lấy đúng `PAGE_SIZE` của bảng thật chứ không đoán một con số nhỏ:
 * bảng phân trang nên trang đầu gần như luôn đủ `PAGE_SIZE` dòng, đoán ít hơn
 * là lúc dữ liệu vào trang giãn ra cả nghìn pixel. Chỉ lệch khi người dùng có
 * ít hơn `PAGE_SIZE` giao dịch, và lệch theo hướng co lại (ít khó chịu hơn giãn).
 */
export function TransactionsSkeleton() {
  const rows = Array.from({ length: PAGE_SIZE });
  return (
    <div aria-busy="true">
      <LoadingStatus />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Block className="h-10 w-full sm:w-72" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <Block className="h-11 sm:h-10 sm:w-36" />
          <Block className="h-11 sm:h-10 sm:w-44" />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2 sm:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-10" />
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <Block className="h-4 w-3/4" />
              <Block className="mt-2 h-3 w-1/2" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Block className="h-4 w-16" />
              <Block className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {["Ngày", "Mô tả", "Danh mục", "Số tiền", ""].map((label, i) => (
                <th key={label || i} className="py-2 pr-3">
                  <Block className="h-3 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <td className="py-2 pr-3">
                  <Block className="h-4 w-16" />
                </td>
                <td className="py-2 pr-3">
                  <Block className="h-4 w-40" />
                </td>
                <td className="py-2 pr-3">
                  <Block className="h-4 w-20 rounded-full" />
                </td>
                <td className="py-2 pr-3 text-right">
                  <Block className="ml-auto h-4 w-20" />
                </td>
                <td className="py-2 pr-3 text-right">
                  <Block className="ml-auto h-4 w-8" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang: bảng thật chỉ hiện nó khi có nhiều hơn PAGE_SIZE dòng.
          Giữ chỗ luôn cho nhất quán với việc vẽ đủ PAGE_SIZE dòng ở trên — cùng
          một giả định "trang đầu đầy". Đo được: thiếu khối này skeleton hụt đúng
          84px so với trang thật đã tải. */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Block className="h-5 w-32 self-center sm:self-auto" />
        <div className="flex gap-2">
          <Block className="h-10 flex-1 rounded-lg sm:h-7 sm:w-16 sm:flex-none" />
          <Block className="h-10 flex-1 rounded-lg sm:h-7 sm:w-16 sm:flex-none" />
        </div>
      </div>
    </div>
  );
}

export { Block as SkeletonBlock, LoadingStatus };
