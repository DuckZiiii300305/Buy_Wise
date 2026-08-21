/**
 * Bọc một Promise với deadline: reject nếu chạy quá lâu, tránh treo request.
 * (Không hủy được request nền ở tầng HTTP, nhưng chặn caller chờ vô hạn.)
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}