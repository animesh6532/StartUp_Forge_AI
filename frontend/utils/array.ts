export function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function isValidDemoLog(l: any): l is { agent?: string; status?: string; log?: string; detail?: string } {
  if (!l || typeof l !== "object") return false;
  return typeof l.agent === "string" || typeof l.log === "string" || typeof l.status === "string";
}
