export const safeNum = (v: any, fallback: number): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? fallback : n; }
  return fallback;
};

export const safeStr = (v: any, fallback: string = ''): string => {
  if (typeof v === 'string') return v;
  if (v == null) return fallback;
  return String(v);
};

export const safeJsonArr = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
};
