import { ImageResponse } from "next/og";

// Icon dành riêng cho iOS (thêm vào màn hình chính) — kích thước 180x180 theo
// khuyến nghị Apple, không bo góc thủ công vì iOS tự bo góc icon khi cài đặt.
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
