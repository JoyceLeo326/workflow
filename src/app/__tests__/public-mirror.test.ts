import { readFile } from "node:fs/promises";
import path from "node:path";

describe("public static mirror contract", () => {
  it("builds an all-relative, dependency-free interaction shell", async () => {
    const root = process.cwd();
    const [html, css, app, packageJson] = await Promise.all([
      readFile(path.join(root, "mirror-src/index.html"), "utf8"),
      readFile(path.join(root, "mirror-src/styles.css"), "utf8"),
      readFile(path.join(root, "mirror-src/app.mjs"), "utf8"),
      readFile(path.join(root, "package.json"), "utf8"),
    ]);

    expect(html).toContain('href="./styles.css"');
    expect(html).toContain('src="./app.mjs"');
    expect(`${html}\n${css}\n${app}`).not.toMatch(/https?:\/\//);
    expect(JSON.parse(packageJson).scripts["build:public-mirror"]).toBeTruthy();
  });
});
