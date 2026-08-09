import { ImageResponse } from "next/og";

// Icon đơn giản, tự sinh bằng code (không thêm dependency, không cần file ảnh
// tĩnh) — chữ "C" của Cardstat trên nền accent xanh, theo hướng dẫn
// app-icons.md của Next 16 (import từ "next/og", không phải "next/server").
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
