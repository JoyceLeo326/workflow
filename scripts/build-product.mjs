import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (process.argv.includes("--vercel-static")) {
  process.env.VERCEL = "1";
  delete process.env.GITHUB_PAGES;
}

const root = process.cwd();
const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

if (process.env.VERCEL === "1" || process.env.GITHUB_PAGES === "1") {
  await rm(resolve(root, "out", "story-v3"), { recursive: true, force: true });
  await import(pathToFileURL(resolve(root, "scripts", "harden-pages-csp.mjs")).href);
}
