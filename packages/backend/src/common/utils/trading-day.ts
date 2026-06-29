/**
 * 交易日计算工具
 *
 * 交易日定义为周一至周五（暂不考虑中国法定节假日）。
 * 未来可扩展接入外部节假日 API。
 */

/**
 * 判断某个日期是否为交易日（周一至周五）
 */
export function isTradingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * 从基准日按交易日（工作日）偏移 n 天
 *
 * @param baseDate  基准日期
 * @param n         偏移交易日数。正数向后（未来），负数向前（过去）
 * @returns         偏移后的日期（始终落在交易日）
 *
 * 示例：
 *   baseDate = 2026-06-22（周一），n = -10
 *   → 跳过两个周末，结果约在 2026-06-08（周一）
 */
export function addTradingDays(baseDate: Date, n: number): Date {
  const result = new Date(baseDate);
  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);

  while (remaining > 0) {
    result.setDate(result.getDate() + step);
    if (isTradingDay(result)) {
      remaining--;
    }
  }

  return result;
}