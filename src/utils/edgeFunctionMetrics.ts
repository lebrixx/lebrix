// Edge Function call metrics & debug mode
// Enable debug: localStorage.setItem('ef_debug', '1') then reload
// Disable: localStorage.removeItem('ef_debug')

interface FunctionMetrics {
  sent: number;
  skipped: number;
  lastSkipReason: string | null;
  lastCallAt: number | null;
}

const metrics: Record<string, FunctionMetrics> = {};

function getOrCreate(fn: string): FunctionMetrics {
  if (!metrics[fn]) {
    metrics[fn] = { sent: 0, skipped: 0, lastSkipReason: null, lastCallAt: null };
  }
  return metrics[fn];
}

const isDebug = (): boolean => {
  try { return localStorage.getItem('ef_debug') === '1'; } catch { return false; }
};

export function trackSent(fn: string): void {
  const m = getOrCreate(fn);
  m.sent++;
  m.lastCallAt = Date.now();
  if (isDebug()) {
    console.log(`[EF] ✅ ${fn} SENT (total: ${m.sent}, skipped: ${m.skipped})`);
  }
}

export function trackSkipped(fn: string, reason: string): void {
  const m = getOrCreate(fn);
  m.skipped++;
  m.lastSkipReason = reason;
  if (isDebug()) {
    console.log(`[EF] ⏭️ ${fn} SKIPPED: ${reason} (total sent: ${m.sent}, skipped: ${m.skipped})`);
  }
}

export function getMetrics(): Record<string, FunctionMetrics> {
  return { ...metrics };
}

// Expose globally for console access
if (typeof window !== 'undefined') {
  (window as any).__efMetrics = getMetrics;
}
