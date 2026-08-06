import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const blockedNarratives = [
  [100, 101, 109, 111],
  [109, 118, 112],
  [104, 97, 99, 107, 97, 116, 104, 111, 110],
  [99, 111, 109, 112, 101, 116, 105, 116, 105, 111, 110],
  [99, 111, 110, 116, 101, 115, 116],
  [106, 117, 100, 103, 101],
  [112, 105, 116, 99, 104, 32, 100, 101, 99, 107],
  [0x7ade, 0x8d5b],
  [0x6bd4, 0x8d5b],
  [0x8bc4, 0x59d4],
  [0x8def, 0x6f14],
  [0x6f14, 0x793a],
].map((points) => String.fromCodePoint(...points));

function trackedProductText() {
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
    cwd: root,
    encoding: "utf8",
    },
  )
    .split("\0")
    .filter(Boolean)
    .filter((file) => textExtensions.has(extname(file)))
    .filter((file) => !file.endsWith("package-lock.json"));

  return files.map((file) => `${file}\n${readFileSync(join(root, file), "utf8")}`).join("\n");
}

describe("lasting product identity", () => {
  it("ships an ownable local logo and a documented visual system", () => {
    const markPath = join(root, "src/components/brand-mark.tsx");
    const guidePath = join(root, "docs/brand-system.md");
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

    expect(existsSync(markPath)).toBe(true);
    expect(existsSync(guidePath)).toBe(true);
    expect(readFileSync(markPath, "utf8")).toMatch(/<svg[\s\S]*viewBox="0 0 48 48"/);
    expect(readFileSync(guidePath, "utf8")).toContain("场记折页");
    for (const token of ["--ink-950", "--paper-50", "--persimmon-500", "--jade-400"]) {
      expect(css).toContain(token);
    }
  });

  it("keeps the public product free of temporary-event framing", () => {
    const productText = trackedProductText().toLowerCase();

    for (const phrase of blockedNarratives) {
      expect(productText).not.toContain(phrase.toLowerCase());
    }
  });

  it("starts directly in the creation flow without account gates", () => {
    const workbench = readFileSync(join(root, "src/components/workbench.tsx"), "utf8");
    const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");

    for (const word of [
      String.fromCodePoint(0x767b, 0x5f55),
      String.fromCodePoint(0x6ce8, 0x518c),
    ]) {
      expect(workbench).not.toContain(word);
    }
    expect(nextConfig).toContain("NEXT_PUBLIC_OFFLINE_MODE");
    expect(nextConfig).not.toContain(
      `NEXT_PUBLIC_BROWSER_${String.fromCodePoint(68, 69, 77, 79)}`,
    );
  });

  it("loads no remote runtime font, script, stylesheet, or image", () => {
    const runtimeFiles = [
      "src/app/layout.tsx",
      "src/app/globals.css",
      "src/components/workbench.tsx",
      "mirror-src/index.html",
      "mirror-src/styles.css",
      "mirror-src/app.js",
    ];
    const runtimeText = runtimeFiles
      .map((file) => readFileSync(join(root, file), "utf8"))
      .join("\n");

    expect(runtimeText).not.toMatch(/https?:\/\//i);
    expect(runtimeText).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
  });
});
