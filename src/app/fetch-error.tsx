"use client";

/**
 * Trạng thái "tải hỏng" cho các trang tự fetch ở client.
 *
 * Có riêng component này vì trước đó các trang chỉ có hai trạng thái: đang tải
 * và có dữ liệu. Fetch fail (mất mạng, 5xx) thì promise reject, state không bao
 * giờ đổi, và skeleton nhấp nháy vĩnh viễn — hứa nội dung sắp tới trong khi nó
 * không bao giờ tới. Skeleton chạy mãi tệ hơn một thông báo lỗi tĩnh.
 */
export function FetchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Không tải được dữ liệu. Kiểm tra kết nối rồi thử lại.
      </p>
      {/* h-11 = 44px, đủ vùng chạm tối thiểu trên mobile như các nút khác */}
      <button
        onClick={onRetry}
        className="mt-3 flex h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Thử lại
      </button>
    </div>
  );
}
