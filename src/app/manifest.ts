import type { MetadataRoute } from "next";

// Web app manifest — cho phép "Thêm vào màn hình chính" trên điện thoại.
// Next tự phục vụ ở /manifest.webmanifest và tự thêm <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cardstat — Quản lý sao kê & chi tiêu",
    short_name: "Cardstat",
    description:
      "Theo dõi sao kê thẻ, phân loại chi tiêu và kiểm soát tài chính cá nhân.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    lang: "vi",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
