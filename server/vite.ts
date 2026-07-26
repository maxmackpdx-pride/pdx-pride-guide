import type { Express } from 'express';
import { createServer as createViteServer, createLogger } from "vite";
import type { Server } from 'node:http';
import { buildGoogleAnalyticsHead } from "./gaSnippet";
import viteConfig from "../vite.config";
import fs from "node:fs";
import path from "node:path";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const listenPort = (() => {
    try {
      const addr = server.address();
      if (addr && typeof addr === "object" && "port" in addr) return addr.port;
    } catch {
      /* ignore */
    }
    return Number(process.env.PORT) || 5050;
  })();

  const serverOptions = {
    middlewareMode: true,
    // Same HTTP port as Express (not Vite's default 5173) so Chrome HMR works.
    hmr: {
      server,
      path: "/vite-hmr",
      clientPort: listenPort,
      protocol: "ws" as const,
    },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl.split("?")[0] ?? req.originalUrl;

    // Only fall back to the SPA shell for app routes - not missing static files.
    if (/\.[a-zA-Z0-9]+$/.test(url) && !url.endsWith(".html")) {
      return res.status(404).end();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Date.now().toString(36)}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      const gaHead = buildGoogleAnalyticsHead();
      if (gaHead && !page.includes("__PDX_GA_ID__")) {
        page = page.replace("</head>", `    ${gaHead}\n  </head>`);
      }
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
