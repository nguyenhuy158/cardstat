import { ImageResponse } from "next/og";
import { BrandIcon } from "./brand-icon";

// Icon tự sinh bằng code (không thêm dependency, không cần file ảnh tĩnh) —
// logo thẻ tín dụng cách điệu, theo hướng dẫn app-icons.md của Next 16
// (import từ "next/og", không phải "next/server"). Bo góc vì đây là favicon
// tab trình duyệt, không có OS nào bo giúp như icon cài đặt trên điện thoại.
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIcon size={size.width} radius={size.width * 0.19} />, { ...size });
}
