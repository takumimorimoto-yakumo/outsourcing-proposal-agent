export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function formatBudget(min: number | null, max: number | null): string {
  if (min && max && min !== max) {
    return `${min.toLocaleString()}円 〜 ${max.toLocaleString()}円`;
  } else if (min) {
    return `${min.toLocaleString()}円`;
  } else if (max) {
    return `〜 ${max.toLocaleString()}円`;
  }
  return "要相談";
}
