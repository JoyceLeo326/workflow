import {
  buildDelivery,
  buildDownloads,
  createRevision,
  generateCandidates,
  normalizeMission,
} from "./experience.js";
import { STORY_SCENES, scenesForCandidate } from "./scenes.js";

const STORAGE_KEY = "creative-ai-mirror-state-v1";
const byId = (id) => document.getElementById(id);
const missionForm = byId("mission-form");
const reviewForm = byId("review-form");
const sourceField = missionForm.elements.source;

let state = {
  mission: null,
  candidates: [],
  selectedId: null,
  delivery: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("浏览器未允许本机保存，请先下载交付稿。");
  }
}

function readMission() {
  const data = new FormData(missionForm);
  return normalizeMission(Object.fromEntries(data.entries()));
}

function syncSourceCount() {
  byId("source-count").textContent = String(sourceField.value.length);
}

function candidateMarkup(candidate, index) {
  const selected = state.selectedId === candidate.id;
  const scene = scenesForCandidate(candidate.id, 1)[0];
  return `
    <button class="candidate-card" type="button" data-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}">
      <span class="candidate-top"><small>${String(index + 1).padStart(2, "0")} · ${escapeHtml(candidate.badge)}</small><span class="candidate-score">${candidate.score}<i>/100</i></span></span>
      <span class="candidate-scene"><img src="${scene.src}" alt="${escapeHtml(scene.alt)}" width="960" height="640" loading="lazy"><span><b>${scene.number}</b>${escapeHtml(scene.beat)}</span></span>
      <h3>${escapeHtml(candidate.title)}</h3>
      <p class="candidate-thesis">${escapeHtml(candidate.thesis)}</p>
      <span class="candidate-route"><small>开场动作</small><p>${escapeHtml(candidate.opening)}</p></span>
      <span class="tradeoff-grid">
        <span><b>得到</b><span>${escapeHtml(candidate.gain)}</span></span>
        <span><b>放弃</b><span>${escapeHtml(candidate.tradeoff)}</span></span>
      </span>
      <span class="selected-check" aria-hidden="true">${selected ? "✓" : ""}</span>
    </button>`;
}

function renderCandidates({ shouldScroll = false } = {}) {
  if (!state.mission || !state.candidates.length) return;
  const section = byId("candidates");
  section.classList.remove("is-hidden");
  byId("candidate-context").textContent = `${state.mission.creator}正在为${state.mission.audience}做一集 ${state.mission.minutes} 分钟短剧；推荐顺序优先守住“${state.mission.priority}”。`;
  byId("candidate-grid").innerHTML = state.candidates.map(candidateMarkup).join("");
  byId("candidate-grid").querySelectorAll("[data-candidate]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.candidate;
      saveState();
      renderCandidates();
      byId("confirm-button").focus();
    });
  });

  const selected = state.candidates.find((candidate) => candidate.id === state.selectedId);
  byId("selected-title").textContent = selected ? `${selected.title} · ${selected.score} 分` : "请选择一条路线";
  byId("confirm-button").disabled = !selected;
  if (shouldScroll) section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDelivery({ shouldScroll = false } = {}) {
  if (!state.delivery) return;
  const delivery = state.delivery;
  byId("delivery").classList.remove("is-hidden");
  byId("review").classList.remove("is-hidden");
  byId("delivery-route").textContent = delivery.decision.title;
  byId("delivery-score").textContent = String(delivery.decision.score);
  byId("delivery-logline").textContent = delivery.logline;
  byId("delivery-tradeoff").textContent = delivery.decision.tradeoff;
  byId("delivery-check").textContent = delivery.nextCheck;
  const confirmedScenes = scenesForCandidate(delivery.decision.candidateId, 5);
  const confirmedScene = confirmedScenes[0];
  byId("delivery-scene").src = confirmedScene.src;
  byId("delivery-scene").alt = confirmedScene.alt;
  byId("delivery-scene-number").textContent = `镜头 ${confirmedScene.number}`;
  byId("delivery-scene-caption").textContent = confirmedScene.beat;
  byId("episode-timeline").innerHTML = delivery.sections
    .map(
      (item) => `<li><time>${escapeHtml(item.time)}</time><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.purpose)}<small>原文锚点：${escapeHtml(item.sourceAnchor)}</small></p></li>`,
    )
    .join("");
  renderRevision();
  if (shouldScroll) byId("delivery").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRevision() {
  const revisions = state.delivery?.revisions ?? [];
  const latest = revisions.at(-1);
  byId("revision-empty").classList.toggle("is-hidden", Boolean(latest));
  byId("revision-result").classList.toggle("is-hidden", !latest);
  if (latest) {
    byId("revision-version").textContent = `第 ${latest.version} 版 · 评分 ${latest.score}/5`;
    byId("revision-action").textContent = latest.action;
    byId("revision-evidence").textContent = `观察证据：${latest.evidence}`;
  }
  if (state.delivery) {
    const revisionScenes = scenesForCandidate(state.delivery.decision.candidateId, 8);
    const sceneIndex = latest ? (latest.version + latest.score) % revisionScenes.length : 1;
    const revisionScene = revisionScenes[sceneIndex] ?? revisionScenes[0];
    byId("review-scene").src = revisionScene.src;
    byId("review-scene").alt = revisionScene.alt;
    byId("review-scene-caption").textContent = latest
      ? `第 ${latest.version} 版转向：${revisionScene.beat}`
      : `待验证镜头：${revisionScene.beat}`;
  }
  byId("review-history").innerHTML = revisions
    .map((revision) => `<span>V${revision.version} · ${escapeHtml(revision.outcome)}</span>`)
    .join("");
}

function restoreForm(mission) {
  if (!mission) return;
  for (const [name, value] of Object.entries(mission)) {
    const field = missionForm.elements[name];
    if (field) field.value = String(value);
  }
  syncSourceCount();
}

function selectAtlasScene(scene) {
  byId("atlas-feature-image").src = scene.src;
  byId("atlas-feature-image").alt = scene.alt;
  byId("atlas-feature-number").textContent = `SCENE ${scene.number} / 24`;
  byId("atlas-feature-title").textContent = scene.title;
  byId("atlas-feature-beat").textContent = scene.beat;
  byId("atlas-grid").querySelectorAll("[data-scene]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scene === scene.id));
  });
}

function renderAtlas() {
  byId("atlas-grid").innerHTML = STORY_SCENES.map((scene, index) => `
    <button type="button" role="listitem" data-scene="${scene.id}" aria-pressed="${index === 0}">
      <img src="${scene.src}" alt="${escapeHtml(scene.alt)}" width="960" height="640" loading="lazy">
      <span><b>${scene.number}</b><strong>${escapeHtml(scene.title)}</strong><small>${escapeHtml(scene.beat)}</small></span>
    </button>`).join("");
  byId("atlas-grid").querySelectorAll("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      const scene = STORY_SCENES.find((item) => item.id === button.dataset.scene);
      if (scene) selectAtlasScene(scene);
    });
  });
}

function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${filename} 已生成并开始下载。`);
}

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.mission = readMission();
  state.candidates = generateCandidates(state.mission);
  state.selectedId = null;
  state.delivery = null;
  byId("delivery").classList.add("is-hidden");
  byId("review").classList.add("is-hidden");
  saveState();
  renderCandidates({ shouldScroll: true });
});

sourceField.addEventListener("input", syncSourceCount);

byId("confirm-button").addEventListener("click", () => {
  const candidate = state.candidates.find((item) => item.id === state.selectedId);
  if (!candidate || !state.mission) return;
  state.delivery = buildDelivery(state.mission, candidate);
  saveState();
  renderDelivery({ shouldScroll: true });
  showToast("路线已确认，交付稿可以下载。 ");
});

byId("change-route").addEventListener("click", () => {
  byId("candidates").scrollIntoView({ behavior: "smooth", block: "start" });
});

byId("download-md").addEventListener("click", () => {
  if (!state.delivery) return;
  const { markdown } = buildDownloads(state.delivery);
  downloadFile(`creative-ai-${state.delivery.decision.candidateId}.md`, markdown, "text/markdown;charset=utf-8");
});

byId("download-json").addEventListener("click", () => {
  if (!state.delivery) return;
  const { json } = buildDownloads(state.delivery);
  downloadFile(`creative-ai-${state.delivery.decision.candidateId}.json`, json, "application/json;charset=utf-8");
});

reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.delivery) return;
  const data = Object.fromEntries(new FormData(reviewForm).entries());
  const revision = createRevision(state.delivery, data);
  state.delivery.revisions.push(revision);
  saveState();
  renderRevision();
  reviewForm.elements.note.value = "";
  byId("revision-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast(`第 ${revision.version} 版修订动作已写回交付稿。`);
});

try {
  const restored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (restored?.mission) {
    state = {
      mission: normalizeMission(restored.mission),
      candidates: Array.isArray(restored.candidates) ? restored.candidates : [],
      selectedId: restored.selectedId || null,
      delivery: restored.delivery || null,
    };
    restoreForm(state.mission);
    renderCandidates();
    renderDelivery();
  }
} catch {
  localStorage.removeItem(STORAGE_KEY);
}

renderAtlas();
syncSourceCount();
