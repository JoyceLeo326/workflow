import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "out");
const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "workflow";
const portIndex = process.argv.indexOf("--port");
const basePathIndex = process.argv.indexOf("--base-path");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4277);
const requestedBasePath = basePathIndex >= 0 ? process.argv[basePathIndex + 1] : `/${repository}`;
const basePath = requestedBasePath === "/" ? "" : requestedBasePath.replace(/\/$/, "");
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (basePath && url.pathname === basePath) {
      response.writeHead(308, { Location: `${basePath}/` });
      response.end();
      return;
    }
    if (basePath && !url.pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    let relativePath = decodeURIComponent(url.pathname.slice(basePath.length + 1));
    if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
    const pathname = resolve(root, relativePath);
    if (pathname !== root && !pathname.startsWith(`${root}${sep}`)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const info = await stat(pathname);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Cache-Control": relativePath.startsWith("_next/") ? "public, max-age=31536000, immutable" : "no-cache",
      "Content-Type": mime[extname(pathname)] ?? "application/octet-stream",
    });
    createReadStream(pathname).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static export available at http://127.0.0.1:${port}${basePath}/`);
});
