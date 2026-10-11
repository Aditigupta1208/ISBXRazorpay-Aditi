/** One quoted CSV cell. Text that starts with = + - @ gets a leading quote so a spreadsheet does not run it as a formula. */
export function csvCell(v: string | number): string {
  const t = typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
  return `"${t.replace(/"/g, '""')}"`;
}
