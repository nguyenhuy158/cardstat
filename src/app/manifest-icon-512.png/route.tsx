import { ImageResponse } from "next/og";
import { BrandIcon } from "../brand-icon";

// Icon 512x512 cho manifest — dùng làm "maskable" (an toàn khi OS crop icon
// thành hình tròn/squircle) nên logo chiếm vùng an toàn giữa, không sát mép.
// Xem manifest-icon-192.png/route.tsx cho lý do dùng route riêng thay vì
// icon.tsx + generateImageMetadata.
export async function GET() {
  return new ImageResponse(<BrandIcon size={512} />, { width: 512, height: 512 });
}
