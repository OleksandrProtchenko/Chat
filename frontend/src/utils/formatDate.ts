export function formatDate(raw: string | null | undefined) {
  if (!raw) return "";
  const d = raw.endsWith("Z") || raw.includes("+") ? new Date(raw) : new Date(raw + "Z");
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}