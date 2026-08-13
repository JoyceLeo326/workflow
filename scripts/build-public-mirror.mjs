import { createHash } from "node:crypto";
import { copyFile, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

const root = process.cwd();
const sourceDir = resolve(root, "mirror-src");
const outputDir = resolve(root, "public-mirror");
const publicPath = "/workflow/mirrors/creative-ai/";
const files = ["index.html", "styles.css", "app.js", "experience.js", "scenes.js"];

if (dirname(outputDir) !== root || basename(outputDir) !== "public-mirror") {
  throw new Error("Refusing to replace an unexpected public mirror directory.");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await copyFile(resolve(sourceDir, file), resolve(outputDir, file));
}
await cp(resolve(root, "public", "story-scenes"), resolve(outputDir, "story-scenes"), {
  recursive: true,
});
await cp(resolve(root, "public", "brand"), resolve(outputDir, "brand"), {
  recursive: true,
});

const inventory = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = [];
  for (const entry of entries) {
    const pathname = resolve(directory, entry.name);
    if (entry.isDirectory()) discovered.push(...await walk(pathname));
    else if (entry.isFile() && entry.name !== "mirror-manifest.json") discovered.push(pathname);
  }
  return discovered;
}

for (const pathname of await walk(outputDir)) {
  const [content, info] = await Promise.all([readFile(pathname), stat(pathname)]);
  inventory.push({
    path: relative(outputDir, pathname).replaceAll("\\", "/"),
    bytes: info.size,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
}
inventory.sort((left, right) => left.path.localeCompare(right.path));

const manifest = {
  schemaVersion: 1,
  kind: "interactive-static-compatibility-mode",
  entry: "index.html",
  assetBase: "./",
  publicPath,
  capabilities: [
    "24 generated story scenes bound to decisions and feedback",
    "personalized source brief",
    "three traceable candidates with trade-offs",
    "explicit confirmation",
    "Markdown and JSON downloads",
    "local feedback backflow",
  ],
  excludes: ["environment files", "server routes", "model credentials", "private user data"],
  files: inventory,
};

await writeFile(resolve(outputDir, "mirror-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Creative AI public mirror built with ${inventory.length} verified runtime files.`);
