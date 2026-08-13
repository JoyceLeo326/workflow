import { readFile } from "node:fs/promises";
import path from "node:path";

describe("public static mirror contract", () => {
  it("builds an all-relative, dependency-free interaction shell", async () => {
    const root = process.cwd();
    const [html, css, app, build, packageJson] = await Promise.all([
      readFile(path.join(root, "mirror-src/index.html"), "utf8"),
      readFile(path.join(root, "mirror-src/styles.css"), "utf8"),
      readFile(path.join(root, "mirror-src/app.js"), "utf8"),
      readFile(path.join(root, "scripts/build-public-mirror.mjs"), "utf8"),
      readFile(path.join(root, "package.json"), "utf8"),
    ]);

    expect(html).toContain('href="./styles.css"');
    expect(html).toContain('src="./app.js"');
    expect(`${html}\n${css}\n${app}`).not.toMatch(/https?:\/\//);
    expect(JSON.parse(packageJson).scripts["build:public-mirror"]).toBeTruthy();
    expect(build).toContain('const publicPath = "/workflow/mirrors/creative-ai/"');
    expect(build).not.toMatch(/liujiarui/i);
    expect(css).toMatch(/\.score-row label\s*\{[^}]*position:\s*relative[^}]*min-width:\s*0/s);
    expect(css).toMatch(/\.score-row input\s*\{[^}]*width:\s*1px[^}]*height:\s*1px[^}]*clip-path:\s*inset\(50%\)/s);
    for (const selector of [".brand", ".site-header nav a", ".text-button", "footer a"]) {
      expect(css).toContain(`${selector} { min-height: 44px;`);
    }
  });
});
