import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const repository = process.env.GITHUB_REPOSITORY ?? "JoyceLeo326/workflow";
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env: {
    ...process.env,
    GITHUB_PAGES: "1",
    GITHUB_REPOSITORY: repository,
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await import(pathToFileURL(resolve(root, "scripts", "harden-pages-csp.mjs")).href);
await writeFile(resolve(root, "out", ".nojekyll"), "", "utf8");
console.log(`GitHub Pages export ready for /${repository.split("/").at(-1)}/.`);
