import type { ReactElement } from "react";

/**
 * Logo dùng chung cho mọi kích thước icon (favicon, apple-icon, icon manifest
 * 192/512): thẻ tín dụng cách điệu (bo góc, nghiêng, có dải từ) trên nền
 * gradient xanh — nhận diện được ngay là "app quản lý thẻ", không chỉ là một
 * chữ cái generic. Không phải route — dùng chung code cho 4 file route khác
 * nhau (icon.tsx, apple-icon.tsx, manifest-icon-192/512.png/route.tsx) thay vì
 * lặp lại JSX, để đổi thiết kế chỉ sửa một chỗ.
 *
 * `radius` = 0 cho apple-icon/manifest icon (OS tự bo góc khi cài đặt, tự bo
 * thêm ở đây sẽ lộ viền vuông dưới lớp bo của OS); favicon 32px thì cần bo vì
 * không ai bo giúp trong tab trình duyệt.
 */
export function BrandIcon({ size, radius = 0 }: { size: number; radius?: number }): ReactElement {
  const cardWidth = size * 0.58;
  const cardHeight = cardWidth * 0.62;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #1d4ed8 100%)",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          width: cardWidth,
          height: cardHeight,
          display: "flex",
          flexDirection: "column",
          background: "#f8fafc",
          borderRadius: cardHeight * 0.16,
          transform: "rotate(-9deg)",
        }}
      >
        {/* Dải từ (magnetic stripe) — chi tiết nhận diện "thẻ" rõ nhất, đặt gần đầu thẻ như thẻ thật. */}
        <div
          style={{
            width: "100%",
            height: cardHeight * 0.22,
            marginTop: cardHeight * 0.16,
            background: "#1e293b",
          }}
        />
        {/* Chip vàng — chi tiết thứ hai, nhỏ hơn để không rối ở kích thước 32px. */}
        <div
          style={{
            display: "flex",
            width: cardWidth * 0.22,
            height: cardHeight * 0.16,
            marginTop: cardHeight * 0.14,
            marginLeft: cardWidth * 0.12,
            borderRadius: cardHeight * 0.04,
            background: "#fbbf24",
          }}
        />
      </div>
    </div>
  );
}
