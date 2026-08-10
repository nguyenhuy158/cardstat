import { ImageResponse } from "next/og";

// Icon 512x512 cho manifest — dùng làm "maskable" (an toàn khi OS crop icon
// thành hình tròn/squircle) nên chữ "C" chiếm vùng an toàn giữa, không sát
// mép. Xem manifest-icon-192.png/route.tsx cho lý do dùng route riêng thay
// vì icon.tsx + generateImageMetadata.
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
          fontSize: 280,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { width: 512, height: 512 },
  );
}
