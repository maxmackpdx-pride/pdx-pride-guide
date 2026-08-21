/**
 * Offline unit smoke for publicHttpUrl (ticket/website href sanitizer).
 * Run: npx tsx script/smoke-safe-http-url.ts
 */
import { publicHttpUrl } from "../shared/safeHttpUrl";

let failed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error("FAIL:", name);
    failed += 1;
  } else {
    console.log("ok:", name);
  }
}

check("https kept", publicHttpUrl("https://tickets.example.com/e") === "https://tickets.example.com/e");
check("http kept", publicHttpUrl("http://example.com") === "http://example.com/");
check("javascript dropped", publicHttpUrl("javascript:alert(1)") == null);
check("data dropped", publicHttpUrl("data:text/html,hi") == null);
check("same-origin path kept", publicHttpUrl("/events/1") === "/events/1");
check("protocol-relative dropped", publicHttpUrl("//evil.test") == null);
check("empty dropped", publicHttpUrl("  ") == null);
check("mailto dropped", publicHttpUrl("mailto:x@y.com") == null);

if (failed) {
  console.error(`\n${failed} FAILED`);
  process.exit(1);
}
console.log("\nAll publicHttpUrl checks passed.");
