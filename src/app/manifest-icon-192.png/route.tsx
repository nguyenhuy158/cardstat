import { ImageResponse } from "next/og";
import { BrandIcon } from "../brand-icon";

// Icon riêng cho web app manifest (192x192) — Chrome/Android bắt buộc icon
// 192 và 512 mới coi trang là "installable". Đặt ở route riêng (không dùng
// icon.tsx + generateImageMetadata) vì URL sinh ra từ generateImageMetadata
// có query hash không đoán trước được, trong khi manifest.ts cần một
// src cố định để khai báo icons[].
export async function GET() {
  return new ImageResponse(<BrandIcon size={192} />, { width: 192, height: 192 });
}
