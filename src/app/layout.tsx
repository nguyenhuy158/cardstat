import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";

// Font chính: Be Vietnam Pro có bộ subset "vietnamese" đầy đủ, hiển thị đúng
// các ký tự có dấu (ví dụ ế, ộ, ữ, ậ) mà không bị fallback sang font khác.
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Font phụ: dùng làm fallback trong cùng font-stack, cũng hỗ trợ tiếng Việt
// đầy đủ nên không tạo ra hiện tượng lệch font giữa các ký tự.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cardstat — Quản lý sao kê & chi tiêu",
  description:
    "Theo dõi sao kê thẻ, phân loại chi tiêu và kiểm soát tài chính cá nhân ngay trên điện thoại.",
  appleWebApp: {
    capable: true,
    title: "Cardstat",
    statusBarStyle: "default",
  },
};

// viewportFit: "cover" là bắt buộc để env(safe-area-inset-*) trả về giá trị
// khác 0 trên iPhone có notch/Dynamic Island — bottom nav (đang được làm ở
// nhánh khác) phụ thuộc vào giá trị này để tránh bị home indicator che mất.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
