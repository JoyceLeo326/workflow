import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const exportRoot = resolve(process.cwd(), "out");

async function findHtml(directory) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const pathname = resolve(directory, entry.name);
    if (entry.isDirectory()) matches.push(...(await findHtml(pathname)));
    else if (entry.isFile() && entry.name.endsWith(".html")) matches.push(pathname);
  }
  return matches;
}

function policyFor(html) {
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]))
    .map((match) => `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`);

  return [
    "default-src 'self'",
    `script-src 'self' ${[...new Set(hashes)].join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const htmlFiles = await findHtml(exportRoot);
if (htmlFiles.length === 0) throw new Error("Static export has no HTML to harden.");

for (const pathname of htmlFiles) {
  const html = await readFile(pathname, "utf8");
  if (!html.includes("<head>")) throw new Error(`Missing <head> in ${pathname}.`);
  if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    throw new Error(`Duplicate Content Security Policy in ${pathname}.`);
  }
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policyFor(html)}"/>`;
  await writeFile(pathname, html.replace("<head>", `<head>${meta}`), "utf8");
}

console.log(`Applied hash-based Content Security Policy to ${htmlFiles.length} HTML files.`);
