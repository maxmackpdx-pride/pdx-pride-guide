function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function readGaMeasurementId(): string | null {
  const id = process.env.GA_MEASUREMENT_ID?.trim();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return null;
  return id;
}

export function buildGoogleAnalyticsHead(): string {
  const id = readGaMeasurementId();
  if (!id) return "";
  const safeId = escapeHtml(id);
  return [
    `<script>window.__PDX_GA_ID__=${JSON.stringify(id)};</script>`,
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeId}"></script>`,
    `<script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', ${JSON.stringify(id)}, { send_page_view: false });
    </script>`,
  ].join("\n    ");
}