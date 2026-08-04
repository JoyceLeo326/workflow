import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import { JSDOM } from "jsdom";

const outputDir = resolve("public-mirror");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relativePath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const filePath = resolve(outputDir, relativePath);
  if (filePath !== outputDir && !filePath.startsWith(`${outputDir}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] ?? "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
assert(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

const domGlobals = ["window", "document", "localStorage", "FormData", "HTMLElement", "Event", "Blob"];
const previous = new Map(domGlobals.map((key) => [key, globalThis[key]]));
let dom;

try {
  const [htmlResponse, stylesResponse, appResponse, experienceResponse] = await Promise.all([
    fetch(`${baseUrl}/index.html`),
    fetch(`${baseUrl}/styles.css`),
    fetch(`${baseUrl}/app.js`),
    fetch(`${baseUrl}/experience.js`),
  ]);

  assert.equal(htmlResponse.status, 200);
  assert.match(htmlResponse.headers.get("content-type") ?? "", /^text\/html/);
  assert.match(stylesResponse.headers.get("content-type") ?? "", /^text\/css/);
  assert.match(appResponse.headers.get("content-type") ?? "", /^text\/javascript/);
  assert.match(experienceResponse.headers.get("content-type") ?? "", /^text\/javascript/);

  const [html, styles, appSource, experienceSource] = await Promise.all([
    htmlResponse.text(),
    stylesResponse.text(),
    appResponse.text(),
    experienceResponse.text(),
  ]);
  dom = new JSDOM(html, { url: `${baseUrl}/index.html`, pretendToBeVisual: true });
  Object.defineProperties(dom.window, {
    innerWidth: { configurable: true, value: 390 },
    innerHeight: { configurable: true, value: 844 },
  });
  const style = dom.window.document.createElement("style");
  style.textContent = styles;
  dom.window.document.head.append(style);
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.URL.createObjectURL = () => "blob:mirror-smoke";
  dom.window.URL.revokeObjectURL = () => {};

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    FormData: dom.window.FormData,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    Blob: dom.window.Blob,
  });

  const engineUrl = `data:text/javascript;base64,${Buffer.from(experienceSource).toString("base64")}`;
  const executableApp = appSource.replace('"./experience.js"', `"${engineUrl}"`);
  assert.notEqual(executableApp, appSource, "App module must import the relative experience module.");
  await import(`data:text/javascript;base64,${Buffer.from(executableApp).toString("base64")}#smoke`);

  const source = document.querySelector('[name="source"]');
  source.value = "她先关掉录音。门外的人敲了三次。她最后把那封信交给了最不该看见的人。";
  source.dispatchEvent(new Event("input", { bubbles: true }));
  assert.equal(document.querySelector("#source-count").textContent, String(source.value.length));

  const form = document.querySelector("#mission-form");
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(document.querySelectorAll("[data-candidate]").length, 3);
  assert.equal(document.querySelector("#candidates").classList.contains("is-hidden"), false);

  document.querySelector("[data-candidate]").click();
  document.querySelector("#confirm-button").click();
  assert.equal(document.querySelector("#delivery").classList.contains("is-hidden"), false);
  assert.equal(document.querySelectorAll("#episode-timeline li").length, 5);

  const review = document.querySelector("#review-form");
  review.elements.note.value = "测试者说不清段尾问题。";
  review.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(document.querySelector("#revision-result").classList.contains("is-hidden"), false);
  assert.match(document.querySelector("#revision-action").textContent, /钩子|开场|问题/);

  const scoreLabel = document.querySelector(".score-row label");
  const scoreInput = scoreLabel.querySelector("input");
  assert.equal(window.getComputedStyle(scoreLabel).position, "relative");
  assert.equal(window.getComputedStyle(scoreInput).position, "absolute");
  assert.equal(window.getComputedStyle(scoreInput).width, "1px");
  assert.equal(window.getComputedStyle(scoreInput).height, "1px");
  assert.equal(window.getComputedStyle(scoreInput).clipPath, "inset(50%)");

  for (const selector of [".brand", ".site-header nav a", ".text-button", "footer a"]) {
    const target = document.querySelector(selector);
    assert(target, `Expected ${selector} in the public mirror.`);
    assert.equal(window.getComputedStyle(target).minHeight, "44px", `${selector} must expose a 44px touch target.`);
  }

  const horizontalOverflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
  assert.equal(horizontalOverflow, 0, "The 390x844 experience must not overflow horizontally.");

  console.log("HTTP mirror smoke passed: MIME, module pipeline, review backflow, 390x844 overflow=0 and 44px touch targets.");
} finally {
  dom?.window.close();
  for (const [key, value] of previous) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
  await new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose())));
}
