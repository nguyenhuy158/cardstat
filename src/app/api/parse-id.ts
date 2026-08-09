/** `Number("abc")` ra NaN và bind thẳng xuống D1 thành lỗi 500 khó hiểu. */
export function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
