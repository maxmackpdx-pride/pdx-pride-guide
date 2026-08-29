const mb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

export function logRuntimeMemory(label: string) {
  const usage = process.memoryUsage();
  console.log(
    `[memory] ${label} rss=${mb(usage.rss)}MB heap_used=${mb(usage.heapUsed)}MB ` +
      `heap_total=${mb(usage.heapTotal)}MB external=${mb(usage.external)}MB ` +
      `array_buffers=${mb(usage.arrayBuffers)}MB`,
  );
}

export function startRuntimeMemoryDiagnostics() {
  if (!/^(1|true)$/i.test(process.env.MEMORY_DIAGNOSTICS?.trim() || "")) return;
  logRuntimeMemory("diagnostics-start");
  const timer = setInterval(() => logRuntimeMemory("interval"), 15 * 60_000);
  timer.unref?.();
}

