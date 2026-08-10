"use client";

import { useEffect } from "react";

// Đăng ký service worker sau khi trang load xong, không chặn render đầu
// tiên. Chrome chỉ hiện nút "Cài đặt ứng dụng" khi có service worker với
// fetch handler đăng ký thành công (xem public/sw.js).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Đăng ký service worker thất bại:", error);
    });
  }, []);

  return null;
}
