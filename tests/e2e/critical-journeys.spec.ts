import { expect, test } from "@playwright/test";

test("anonymous visitor can discover events and open a listing", async ({ page }) => {
  await page.goto("/events");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).toHaveTitle(/Zaylist|Pride/i);

  const eventLink = page.locator('a[href^="/events/"]').first();
  if (await eventLink.count()) {
    await eventLink.click();
    await expect(page).toHaveURL(/\/events\//);
  }
});

test("directory and schedule routes render without an application error", async ({ page }) => {
  for (const path of ["/directory", "/schedule"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/application error|something went wrong/i)).toHaveCount(0);
  }
});

test("protected dashboard presents authentication instead of private data", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByText(/sign in|log in|join/i).first()).toBeVisible();
});
