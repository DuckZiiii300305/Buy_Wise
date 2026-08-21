// Log lỗi thật ở server-side nhưng KHÔNG trả chi tiết nội bộ cho client.
// Ngăn lộ stack trace / thông tin DB / key ra ngoài.
export function errMsg(error: unknown): string {
  console.error('[BuyWise]', error);
  return 'Internal server error.';
}