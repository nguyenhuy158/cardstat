"use client";

import { useRef, useState } from "react";

import { LoadingStatus, SkeletonBlock } from "@/app/skeleton";
import { UploadHistory } from "@/app/upload-history";

/**
 * Trang "Nhập" (`/upload`) — khu vực tải PDF lên và lịch sử các lần nhập. Không
 * hiển thị tổng hợp/biểu đồ/bảng ở đây (đã tách sang route riêng), nên sau khi
 * nhập thành công chỉ báo số giao dịch và gợi ý người dùng qua "Tổng quan"
 * hoặc "Giao dịch" để xem chi tiết.
 */
export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  // Tăng sau mỗi lần nhập xong để lịch sử bên dưới nạp lại danh sách mới.
  const [historyKey, setHistoryKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as {
        error?: string;
        inserted?: number;
        skipped?: number;
        message?: string;
      };
      if (!res.ok) {
        setMessage(`Lỗi: ${data.error}`);
      } else {
        const inserted = data.inserted ?? 0;
        const skipped = data.skipped ?? 0;
        // Nhập lại đúng file cũ thì không có dòng nào mới — phải nói rõ là do
        // trùng, chứ báo "đã nhập 0 giao dịch" người dùng sẽ tưởng hỏng.
        if (inserted === 0 && skipped > 0) {
          setMessage(data.message || `Toàn bộ ${skipped} giao dịch trong file đã có sẵn, không có gì mới.`);
        } else if (skipped > 0) {
          setMessage(
            `Đã nhập ${inserted} giao dịch từ ${file.name}, bỏ qua ${skipped} giao dịch trùng. Xem "Tổng quan" hoặc "Giao dịch" để biết chi tiết.`,
          );
        } else {
          setMessage(
            `Đã nhập ${inserted} giao dịch từ ${file.name}. Xem "Tổng quan" hoặc "Giao dịch" để biết chi tiết.`,
          );
        }
      }
    } catch {
      setMessage("Lỗi khi tải file lên");
    } finally {
      // Nạp lại cả khi hỏng: upload có thể ghi được một phần rồi mới đứt.
      setHistoryKey((k) => k + 1);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const uploadCard = (
    <section
      aria-busy={uploading}
      className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="mb-3 font-semibold">Nhập sao kê (PDF)</h2>
      <label
        className={`flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/20 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus-within:ring-zinc-100/20 ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? "Đang xử lý..." : "Chạm để chọn file PDF sao kê"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      {/* Giữ trước chỗ cho dòng kết quả trong lúc đang xử lý — trước đây chỗ này
          trống hẳn rồi mới bật ra sau khi xong, làm đoạn ghi chú dưới nhảy vị
          trí; skeleton khớp chiều cao một dòng text-sm giữ chỗ ổn định. */}
      {uploading && !message && (
        <div className="mt-3">
          <LoadingStatus />
          <SkeletonBlock className="h-5 w-3/4" />
        </div>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Hỗ trợ file PDF sao kê ngân hàng/thẻ tín dụng. Hệ thống tự dò từng dòng có ngày và số tiền để nhận diện giao dịch.
      </p>
    </section>
  );

  return (
    <div className="space-y-4">
      {uploadCard}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 font-semibold">Lịch sử nhập</h2>
        <UploadHistory
          refreshKey={historyKey}
          // Xóa một lần nhập là xóa cả cụm giao dịch — thông báo "đã nhập N
          // giao dịch" của lần trước không còn đúng nữa, dọn đi.
          onChanged={() => setMessage("")}
        />
      </section>
    </div>
  );
}
