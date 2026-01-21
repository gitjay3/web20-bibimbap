export default function toISODateTime(date?: string, time?: string): string | null {
  if (!date || !time) return null;

  const d = new Date(`${date}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString();
}
