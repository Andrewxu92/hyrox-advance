/** Short unique id for DB rows (timestamp + random). */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
