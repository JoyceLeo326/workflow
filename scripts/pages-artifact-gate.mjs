import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "out");
const target = process.argv.includes("--target=vercel") ? "vercel" : "pages";
const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "workflow";
const basePath = target === "pages" ? `/${repository}` : "";

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const pathname = resolve(directory, entry.name);
    if (!pathname.startsWith(`${root}${sep}`)) throw new Error("Artifact escaped the export root.");
    if (entry.isDirectory()) paths.push(...(await walk(pathname)));
    else if (entry.isFile()) paths.push(pathname);
  }
  return paths;
}

const files = await walk(root);
const names = files.map((pathname) => relative(root, pathname).replaceAll("\\", "/"));
const requiredFiles = target === "pages" ? ["index.html", ".nojekyll"] : ["index.html"];
for (const required of requiredFiles) {
  if (!names.includes(required)) throw new Error(`Static export is missing ${required}.`);
}
if (names.some((name) => name === "api" || name.startsWith("api/"))) {
  throw new Error("Static export must not contain server API routes.");
}

const scenes = files.filter((pathname) => /story-scenes[\\/].+\.webp$/i.test(pathname));
if (scenes.length !== 24) throw new Error(`Expected 24 story scenes, found ${scenes.length}.`);
const hashes = new Set();
for (const scene of scenes) {
  const [content, info] = await Promise.all([readFile(scene), stat(scene)]);
  if (info.size < 30_000) throw new Error(`Story scene is too small: ${basename(scene)}.`);
  hashes.add(createHash("sha256").update(content).digest("hex"));
}
if (hashes.size !== scenes.length) throw new Error("Pages story scenes must be independently authored files.");

const runtimeFiles = files.filter((pathname) => /\.(?:html|js|css|json|txt)$/i.test(pathname));
const runtimeText = (await Promise.all(runtimeFiles.map((pathname) => readFile(pathname, "utf8")))).join("\n");
for (const marker of [
  "无账号门槛",
  "本机保存",
  "静态兼容模式",
  "0成本",
  "零成本",
  String.fromCodePoint(77, 86, 80),
  String.fromCodePoint(0x6bd4, 0x8d5b, 0x4f5c, 0x54c1),
]) {
  if (runtimeText.includes(marker)) throw new Error(`Forbidden product meta copy found: ${marker}.`);
}
for (const marker of ["fonts.googleapis.com", "fonts.gstatic.com", "unpkg.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "/_next/image?"]) {
  if (runtimeText.includes(marker)) throw new Error(`External or metered runtime dependency found: ${marker}.`);
}

const htmlFiles = files.filter((pathname) => pathname.endsWith(".html"));
for (const pathname of htmlFiles) {
  const page = await readFile(pathname, "utf8");
  const policyMatch = page.match(
    /<head><meta http-equiv="Content-Security-Policy" content="([^"]+)"\/>/i,
  );
  if (!policyMatch) throw new Error(`Missing early Content Security Policy in ${relative(root, pathname)}.`);

  const directives = new Map(
    policyMatch[1].split(";").map((directive) => {
      const [name, ...values] = directive.trim().split(/\s+/);
      return [name, values];
    }),
  );
  for (const [name, expected] of [
    ["default-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ]) {
    if (JSON.stringify(directives.get(name)) !== JSON.stringify(expected)) {
      throw new Error(`Unsafe ${name} directive in ${relative(root, pathname)}.`);
    }
  }

  const scriptSources = directives.get("script-src") ?? [];
  if (!scriptSources.includes("'self'") || scriptSources.includes("'unsafe-inline'") || scriptSources.includes("'unsafe-eval'")) {
    throw new Error(`Unsafe script-src directive in ${relative(root, pathname)}.`);
  }
  const expectedHashes = [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]))
    .map((match) => `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`)
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
  const allowedHashes = scriptSources.filter((source) => source.startsWith("'sha256-")).sort();
  if (JSON.stringify(allowedHashes) !== JSON.stringify(expectedHashes)) {
    throw new Error(`Inline script hashes are incomplete or excessive in ${relative(root, pathname)}.`);
  }
}
const html = await readFile(resolve(root, "index.html"), "utf8");
if (!html.includes(`${basePath}/_next/`)) throw new Error("Next assets are not scoped to the deployment base path.");
if (!html.includes(`${basePath}/story-scenes/`)) throw new Error("Story scenes are not scoped to the deployment base path.");

console.log(`${target === "pages" ? "Pages" : "Vercel"} static artifact gate passed: ${names.length} files, 24 unique story scenes, no APIs or external runtime dependencies.`);
