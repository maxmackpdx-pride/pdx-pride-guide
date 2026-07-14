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