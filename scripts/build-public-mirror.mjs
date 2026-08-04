import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const root = process.cwd();
const sourceDir = resolve(root, "mirror-src");
const outputDir = resolve(root, "public-mirror");
const publicPath = "/liujiarui-product-lab/mirrors/creative-ai/";
const files = ["index.html", "styles.css", "app.js", "experience.js"];

if (dirname(outputDir) !== root || basename(outputDir) !== "public-mirror") {
  throw new Error("Refusing to replace an unexpected public mirror directory.");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await copyFile(resolve(sourceDir, file), resolve(outputDir, file));
}

const inventory = [];
for (const file of files) {
  const pathname = resolve(outputDir, file);
  const [content, info] = await Promise.all([readFile(pathname), stat(pathname)]);
  inventory.push({
    path: file,
    bytes: info.size,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
}

const manifest = {
  schemaVersion: 1,
  kind: "interactive-static-compatibility-mode",
  entry: "index.html",
  assetBase: "./",
  publicPath,
  capabilities: [
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
