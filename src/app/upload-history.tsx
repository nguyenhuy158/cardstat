"use client";

import { useEffect, useState } from "react";

import { FetchError } from "./fetch-error";
import { formatDateTime } from "./format";
import { SkeletonBlock } from "./skeleton";

type Upload = {
  id: number;
  filename: string;
  uploaded_at: string;
  skipped_count: number;
  transaction_count: number;
};

/**
 * Lịch sử nhập sao kê. Xóa một dòng ở đây là xóa luôn các giao dịch của lần
 * nhập đó — đường thoát khi lỡ nhập nhầm file, thay vì phải xóa tay từng dòng
 * ở trang Giao dịch.
 *
 * `refreshKey` do trang cha tăng sau mỗi lần upload xong để danh sách tự nạp lại.
 */
export function UploadHistory({
  refreshKey,
  onChanged,
}: {
  refreshKey: number;
  onChanged: () => void;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Xóa cả cụm giao dịch nên phải hỏi lại — khác nút xóa từng dòng ở trang Giao
  // dịch (mất một dòng, nhập lại dễ). Xác nhận ngay tại chỗ bằng state, không
  // kéo thêm dependency dialog chỉ cho một nút.
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/uploads")
      .then((res) => res.json<Upload[]>())
      .then((data) => {
        if (cancelled) return;
        setUploads(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    // Upload xong là refreshKey đổi ngay, request cũ có thể về sau request mới
    // và ghi đè bằng dữ liệu cũ — cờ này bỏ kết quả của effect đã bị thay thế.
    return () => {
      cancelled = true;
    };
  }, [refreshKey, retryKey]);

  async function handleDelete(id: number) {
    setDeleteError(null);
    setDeletingId(id);
    const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" }).catch(() => null);
    setDeletingId(null);
    setConfirmingId(null);

    if (!res?.ok) {
      setDeleteError("Không xóa được lần nhập này. Thử lại nhé.");
      return;
    }
    setUploads((rows) => rows.filter((u) => u.id !== id));
    // Tổng hợp và bảng giao dịch ở các trang khác cũng đổi theo.
    onChanged();
  }

  if (failed) {
    return (
      <FetchError
        onRetry={() => {
          setFailed(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <SkeletonBlock className="h-16 w-full" />
        <SkeletonBlock className="h-16 w-full" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Chưa nhập file nào. Sau khi nhập, mỗi lần sẽ hiện ở đây kèm thời điểm nhập.
      </p>
    );
  }

  return (
    <>
      {deleteError && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {deleteError}
        </p>
      )}

      <ul className="space-y-2">
        {uploads.map((upload) => (
          <li
            key={upload.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {upload.filename}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDateTime(upload.uploaded_at)} · {upload.transaction_count} giao dịch
                {upload.skipped_count > 0 && ` · bỏ qua ${upload.skipped_count} dòng trùng`}
              </p>
            </div>

            {confirmingId === upload.id ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(upload.id)}
                  disabled={deletingId === upload.id}
                  className="h-11 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:outline-none disabled:opacity-60 sm:h-10"
                >
                  {deletingId === upload.id ? "Đang xóa..." : "Xóa"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  disabled={deletingId === upload.id}
                  className="h-11 rounded-lg border border-zinc-300 px-3 text-sm transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900/30 focus-visible:outline-none disabled:opacity-60 sm:h-10 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmingId(upload.id);
                }}
                // Nhãn nói rõ xóa bao nhiêu giao dịch: người dùng nhớ tên file,
                // không nhớ file đó kéo theo bao nhiêu dòng.
                aria-label={`Xóa lần nhập ${upload.filename} và ${upload.transaction_count} giao dịch của nó`}
                className="h-11 shrink-0 rounded-lg border border-zinc-300 px-3 text-sm text-red-700 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:outline-none sm:h-10 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                Xóa
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Nhập lại đúng sao kê cũ bị bỏ qua vì trùng, nên các dòng chồng lấn vẫn
          thuộc lần nhập đầu tiên — nói trước để không ai bất ngờ khi xóa lần
          nhập cũ mà mất cả giao dịch tưởng là của lần nhập sau. */}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Giao dịch trùng giữa hai lần nhập được tính cho lần nhập đầu tiên, nên xóa lần nhập cũ
        sẽ xóa luôn những giao dịch đó.
      </p>
    </>
  );
}
