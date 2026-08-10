import { ImageResponse } from "next/og";

// Icon riêng cho web app manifest (192x192) — Chrome/Android bắt buộc icon
// 192 và 512 mới coi trang là "installable". Đặt ở route riêng (không dùng
// icon.tsx + generateImageMetadata) vì URL sinh ra từ generateImageMetadata
// có query hash không đoán trước được, trong khi manifest.ts cần một
// src cố định để khai báo icons[].
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          color: "#ffffff",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { width: 192, height: 192 },
  );
}
