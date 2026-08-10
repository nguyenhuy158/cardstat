"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">500</p>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
        Có lỗi xảy ra
      </h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Đã có sự cố ngoài dự kiến. Thử tải lại trang.
      </p>
      <button
        onClick={reset}
        className="mt-2 flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Thử lại
      </button>
    </div>
  );
}
