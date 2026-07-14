/** Shared Playwright login for local smoke suites (retries on 429). */

export async function smokeLogin(request, base, {
  email = "tucker@test.com",
  password = "smoketest",
  attempts = 5,
} = {}) {
  let lastBody = "";
  for (let i = 0; i < attempts; i++) {
    const res = await request.post(`${base}/api/auth/login`, {
      data: { email, password },
    });
    if (res.ok()) return res;
    lastBody = await res.text();
    if (res.status() === 429 && i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      continue;
    }
    throw new Error(`Login failed: ${res.status()} ${lastBody}`);
  }
  throw new Error(`Login failed: ${lastBody}`);
}

/** Disable PWA service-worker reloads that close the inbox mid-test on preview:local. */
export async function prepareSmokeContext(context) {
  await context.addInitScript(() => {
    window.__PDX_LOCAL_PREVIEW__ = 1;
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const nativeRegister = sw.register.bind(sw);
    sw.register = async (...args) => {
      if (window.__PDX_LOCAL_PREVIEW__) {
        return {
          addEventListener: () => {},
          unregister: async () => true,
          installing: null,
          waiting: null,
          active: { state: "activated" },
        };
      }
      return nativeRegister(...args);
    };
  });
}

/** Wait until auth + shell are stable (avoids SW reload race on production bundles). */
export async function waitForAppStable(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page
    .waitForResponse((r) => r.url().includes("/api/auth/me") && r.ok(), { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(300);
}