import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const buildScript = resolve(root, "scripts", "build-product.mjs");
const repository = process.env.GITHUB_REPOSITORY ?? "JoyceLeo326/workflow";
const result = spawnSync(process.execPath, [buildScript], {
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

await writeFile(resolve(root, "out", ".nojekyll"), "", "utf8");
console.log(`GitHub Pages export ready for /${repository.split("/").at(-1)}/.`);
