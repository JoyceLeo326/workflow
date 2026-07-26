"use client";

import {
  Archive,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  CircleStop,
  Download,
  FileJson2,
  FileText,
  Film,
  History,
  KeyRound,
  Loader2,
  MapPinned,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  buildDocxBlob,
  buildFountain,
  buildPdfBlob,
  buildProjectArchive,
  buildSrt,
} from "@/lib/production/exporters";
import { productionFromProject } from "@/lib/production/from-project";
import {
  requestProductionDocument,
  validateProviderConfig,
} from "@/lib/production/provider";
import {
  restoreProductionVersion,
  saveProductionVersion,
} from "@/lib/production/versioning";
import type {
  ProductionDocument,
  ProductionEpisode,
  ProductionScene,
  SessionProviderConfig,
} from "@/lib/production/types";
import type { AgentStep, Project } from "@/lib/workflow/types";

type EditorTab = "story" | "episodes";
type ExportKind = "fountain" | "docx" | "pdf" | "srt" | "zip";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";
const compactFieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function uid(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "chuangju-project";
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, type: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: `${type};charset=utf-8` }));
}

function updateAllSteps(
  steps: AgentStep[],
  status: AgentStep["status"],
  error?: string,
): AgentStep[] {
  const now = new Date().toISOString();
  return steps.map((step) => ({
    ...step,
    status,
    progress: status === "completed" ? 100 : status === "waiting" ? 0 : 50,
    startedAt: status === "running" ? now : step.startedAt,
    completedAt: status === "completed" ? now : undefined,
    error,
  }));
}

function ProviderPanel({
  config,
  onChange,
  isOpen,
  onToggle,
}: {
  config: SessionProviderConfig;
  onChange: (config: SessionProviderConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const validation = validateProviderConfig(config);
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        type="button"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">生成服务</h2>
            <p className="mt-1 text-xs text-slate-500">
              {validation.valid ? `${config.model} · 当前页面会话` : "连接 OpenAI-compatible 服务"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              validation.valid
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {validation.valid ? "已就绪" : "未连接"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>
      {isOpen ? (
        <div className="border-t border-slate-100 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-medium text-slate-600">
                HTTPS 服务地址
              </span>
              <input
                aria-label="HTTPS 服务地址"
                className={fieldClass}
                placeholder="https://api.example.com/v1"
                value={config.baseUrl}
                onChange={(event) => onChange({ ...config, baseUrl: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">模型</span>
              <input
                aria-label="模型"
                className={fieldClass}
                placeholder="deepseek-chat"
                value={config.model}
                onChange={(event) => onChange({ ...config, model: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">
                请求超时（秒）
              </span>
              <input
                aria-label="请求超时"
                className={fieldClass}
                min={5}
                max={300}
                type="number"
                value={Math.round(config.timeoutMs / 1000)}
                onChange={(event) =>
                  onChange({
                    ...config,
                    timeoutMs: Math.max(0, Number(event.target.value) * 1000),
                  })
                }
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-medium text-slate-600">API Key</span>
              <div className="flex gap-2">
                <input
                  aria-label="API Key"
                  autoComplete="off"
                  className={fieldClass}
                  placeholder="仅保留在当前页面内存"
                  type="password"
                  value={config.apiKey}
                  onChange={(event) => onChange({ ...config, apiKey: event.target.value })}
                />
                {config.apiKey ? (
                  <button
                    aria-label="清除 API Key"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"
                    type="button"
                    onClick={() => onChange({ ...config, apiKey: "" })}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </label>
          </div>
          <div
            className={`mt-4 rounded-xl px-3 py-2 text-xs leading-5 ${
              validation.valid
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {validation.valid
              ? "配置只在当前页面会话中使用，不写入项目和浏览器存储。"
              : validation.error}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StoryEditor({
  production,
  onChange,
}: {
  production: ProductionDocument;
  onChange: (production: ProductionDocument) => void;
}) {
  const bible = production.storyBible;
  const patchBible = <K extends keyof typeof bible>(key: K, value: (typeof bible)[K]) => {
    onChange({
      ...production,
      updatedAt: new Date().toISOString(),
      storyBible: { ...bible, [key]: value },
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-600">作品名称</span>
            <input
              aria-label="Story Bible 作品名称"
              className={fieldClass}
              value={bible.title}
              onChange={(event) => patchBible("title", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-600">类型</span>
            <input
              aria-label="故事类型"
              className={fieldClass}
              placeholder="例如：都市悬疑"
              value={bible.genre}
              onChange={(event) => patchBible("genre", event.target.value)}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-medium text-slate-600">一句话故事</span>
            <textarea
              aria-label="一句话故事"
              className={`${fieldClass} min-h-24 resize-y`}
              value={bible.logline}
              onChange={(event) => patchBible("logline", event.target.value)}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-medium text-slate-600">主题</span>
            <input
              aria-label="故事主题"
              className={fieldClass}
              placeholder="用逗号分隔"
              value={bible.themes.join("，")}
              onChange={(event) =>
                patchBible(
                  "themes",
                  event.target.value
                    .split(/[，,]/)
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-violet-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900">人物</h3>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700"
            type="button"
            onClick={() =>
              patchBible("characters", [
                ...bible.characters,
                {
                  id: uid("character"),
                  name: "新人物",
                  role: "",
                  goal: "",
                  arc: "",
                  relationships: "",
                  sourceRef: "待回核原著",
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            添加人物
          </button>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {bible.characters.map((character, index) => (
            <article key={character.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">
                  CHARACTER {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  aria-label={`删除人物 ${character.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  type="button"
                  onClick={() =>
                    patchBible(
                      "characters",
                      bible.characters.filter((item) => item.id !== character.id),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["name", "姓名"],
                    ["role", "角色"],
                    ["goal", "目标"],
                    ["arc", "人物弧"],
                    ["relationships", "关系"],
                    ["sourceRef", "原著来源"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={key === "arc" || key === "relationships" ? "sm:col-span-2" : ""}>
                    <span className="mb-1 block text-[11px] text-slate-500">{label}</span>
                    <input
                      aria-label={`${character.name} ${label}`}
                      className={compactFieldClass}
                      value={character[key]}
                      onChange={(event) => {
                        const characters = clone(bible.characters);
                        characters[index][key] = event.target.value;
                        patchBible("characters", characters);
                      }}
                    />
                  </label>
                ))}
              </div>
            </article>
          ))}
          {!bible.characters.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              尚未确认人物
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-violet-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900">场景地点</h3>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700"
            type="button"
            onClick={() =>
              patchBible("locations", [
                ...bible.locations,
                {
                  id: uid("location"),
                  name: "新地点",
                  description: "",
                  sourceRef: "待回核原著",
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            添加地点
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {bible.locations.map((location, index) => (
            <article key={location.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-2">
                  <input
                    aria-label={`地点 ${index + 1} 名称`}
                    className={compactFieldClass}
                    value={location.name}
                    onChange={(event) => {
                      const locations = clone(bible.locations);
                      locations[index].name = event.target.value;
                      patchBible("locations", locations);
                    }}
                  />
                  <textarea
                    aria-label={`${location.name} 描述`}
                    className={`${compactFieldClass} min-h-20 resize-y`}
                    placeholder="地点、时段、天气、光照与复用规则"
                    value={location.description}
                    onChange={(event) => {
                      const locations = clone(bible.locations);
                      locations[index].description = event.target.value;
                      patchBible("locations", locations);
                    }}
                  />
                  <input
                    aria-label={`${location.name} 原著来源`}
                    className={compactFieldClass}
                    value={location.sourceRef}
                    onChange={(event) => {
                      const locations = clone(bible.locations);
                      locations[index].sourceRef = event.target.value;
                      patchBible("locations", locations);
                    }}
                  />
                </div>
                <button
                  aria-label={`删除地点 ${location.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  type="button"
                  onClick={() =>
                    patchBible(
                      "locations",
                      bible.locations.filter((item) => item.id !== location.id),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function EpisodesEditor({
  production,
  onChange,
}: {
  production: ProductionDocument;
  onChange: (production: ProductionDocument) => void;
}) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const selected =
    production.episodes.find((episode) => episode.id === selectedEpisodeId) ??
    production.episodes[0];
  const episodeIndex = selected
    ? production.episodes.findIndex((episode) => episode.id === selected.id)
    : -1;

  const replaceEpisodes = (episodes: ProductionEpisode[]) =>
    onChange({ ...production, episodes, updatedAt: new Date().toISOString() });
  const patchEpisode = <K extends keyof ProductionEpisode>(
    key: K,
    value: ProductionEpisode[K],
  ) => {
    if (episodeIndex < 0) return;
    const episodes = clone(production.episodes);
    episodes[episodeIndex][key] = value;
    replaceEpisodes(episodes);
  };

  const addEpisode = () => {
    const id = uid("episode");
    const episode: ProductionEpisode = {
      id,
      episodeNumber: production.episodes.length + 1,
      title: `第 ${production.episodes.length + 1} 集`,
      logline: "",
      endingHook: "",
      scenes: [],
    };
    replaceEpisodes([...production.episodes, episode]);
    setSelectedEpisodeId(id);
  };

  const addScene = () => {
    if (!selected) return;
    patchEpisode("scenes", [
      ...selected.scenes,
      {
        id: uid("scene"),
        sceneNumber: selected.scenes.length + 1,
        heading: `场景 ${selected.scenes.length + 1}`,
        summary: "",
        action: "",
        characters: [],
        dialogue: "",
        sourceRef: "待回核原著",
        durationSeconds: 6,
      },
    ]);
  };

  const patchScene = <K extends keyof ProductionScene>(
    sceneIndex: number,
    key: K,
    value: ProductionScene[K],
  ) => {
    if (!selected) return;
    const scenes = clone(selected.scenes);
    scenes[sceneIndex][key] = value;
    patchEpisode("scenes", scenes);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {production.episodes.map((episode) => (
          <button
            key={episode.id}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium ${
              selected?.id === episode.id
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            type="button"
            onClick={() => setSelectedEpisodeId(episode.id)}
          >
            {episode.episodeNumber}. {episode.title}
          </button>
        ))}
        <button
          aria-label="添加分集"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-dashed border-violet-300 text-violet-700"
          type="button"
          onClick={addEpisode}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {selected ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="grid gap-3 md:grid-cols-[120px_1fr]">
              <label>
                <span className="mb-1 block text-[11px] text-slate-500">集数</span>
                <input
                  aria-label="集数"
                  className={fieldClass}
                  min={1}
                  type="number"
                  value={selected.episodeNumber}
                  onChange={(event) =>
                    patchEpisode("episodeNumber", Math.max(1, Number(event.target.value)))
                  }
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] text-slate-500">标题</span>
                <input
                  aria-label="分集标题"
                  className={fieldClass}
                  value={selected.title}
                  onChange={(event) => patchEpisode("title", event.target.value)}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-[11px] text-slate-500">本集梗概</span>
                <textarea
                  aria-label="本集梗概"
                  className={`${fieldClass} min-h-20 resize-y`}
                  value={selected.logline}
                  onChange={(event) => patchEpisode("logline", event.target.value)}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-[11px] text-slate-500">结尾钩子</span>
                <input
                  aria-label="结尾钩子"
                  className={fieldClass}
                  value={selected.endingHook}
                  onChange={(event) => patchEpisode("endingHook", event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              场景 · {selected.scenes.length}
            </h3>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700"
              type="button"
              onClick={addScene}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              添加场景
            </button>
          </div>

          <div className="space-y-3">
            {selected.scenes.map((scene, sceneIndex) => (
              <article key={scene.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-violet-700">
                    SCENE {String(scene.sceneNumber).padStart(2, "0")}
                  </span>
                  <button
                    aria-label={`删除场景 ${scene.sceneNumber}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    type="button"
                    onClick={() =>
                      patchEpisode(
                        "scenes",
                        selected.scenes.filter((item) => item.id !== scene.id),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[100px_1fr_130px]">
                  <label>
                    <span className="mb-1 block text-[11px] text-slate-500">场次</span>
                    <input
                      aria-label={`场景 ${sceneIndex + 1} 场次`}
                      className={compactFieldClass}
                      min={1}
                      type="number"
                      value={scene.sceneNumber}
                      onChange={(event) =>
                        patchScene(sceneIndex, "sceneNumber", Math.max(1, Number(event.target.value)))
                      }
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] text-slate-500">场景标题</span>
                    <input
                      aria-label={`场景 ${sceneIndex + 1} 标题`}
                      className={compactFieldClass}
                      value={scene.heading}
                      onChange={(event) => patchScene(sceneIndex, "heading", event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] text-slate-500">时长（秒）</span>
                    <input
                      aria-label={`场景 ${sceneIndex + 1} 时长`}
                      className={compactFieldClass}
                      min={1}
                      type="number"
                      value={scene.durationSeconds}
                      onChange={(event) =>
                        patchScene(
                          sceneIndex,
                          "durationSeconds",
                          Math.max(1, Number(event.target.value)),
                        )
                      }
                    />
                  </label>
                  <label className="md:col-span-3">
                    <span className="mb-1 block text-[11px] text-slate-500">场景摘要</span>
                    <textarea
                      aria-label={`场景 ${sceneIndex + 1} 摘要`}
                      className={`${compactFieldClass} min-h-16 resize-y`}
                      value={scene.summary}
                      onChange={(event) => patchScene(sceneIndex, "summary", event.target.value)}
                    />
                  </label>
                  <label className="md:col-span-3">
                    <span className="mb-1 block text-[11px] text-slate-500">动作</span>
                    <textarea
                      aria-label={`场景 ${sceneIndex + 1} 动作`}
                      className={`${compactFieldClass} min-h-20 resize-y`}
                      value={scene.action}
                      onChange={(event) => patchScene(sceneIndex, "action", event.target.value)}
                    />
                  </label>
                  <label className="md:col-span-3">
                    <span className="mb-1 block text-[11px] text-slate-500">对白</span>
                    <textarea
                      aria-label={`场景 ${sceneIndex + 1} 对白`}
                      className={`${compactFieldClass} min-h-24 resize-y font-mono`}
                      placeholder="角色：对白"
                      value={scene.dialogue}
                      onChange={(event) => patchScene(sceneIndex, "dialogue", event.target.value)}
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-[11px] text-slate-500">出场人物</span>
                    <input
                      aria-label={`场景 ${sceneIndex + 1} 人物`}
                      className={compactFieldClass}
                      placeholder="用逗号分隔"
                      value={scene.characters.join("，")}
                      onChange={(event) =>
                        patchScene(
                          sceneIndex,
                          "characters",
                          event.target.value
                            .split(/[，,]/)
                            .map((item) => item.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] text-slate-500">原著来源</span>
                    <input
                      aria-label={`场景 ${sceneIndex + 1} 原著来源`}
                      className={compactFieldClass}
                      value={scene.sourceRef}
                      onChange={(event) => patchScene(sceneIndex, "sourceRef", event.target.value)}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ProductionWorkspace({
  project,
  onProjectChange,
}: {
  project: Project | null;
  onProjectChange: (project: Project) => void;
}) {
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerConfig, setProviderConfig] = useState<SessionProviderConfig>({
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKey: "",
    timeoutMs: 60_000,
  });
  const [editorTab, setEditorTab] = useState<EditorTab>("story");
  const [versionLabel, setVersionLabel] = useState("");
  const [status, setStatus] = useState("导入原著后开始创作");
  const [isGenerating, setIsGenerating] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const validation = validateProviderConfig(providerConfig);
  const production = project?.production;
  const history = project?.productionHistory ?? [];

  const sceneCount = useMemo(
    () => production?.episodes.reduce((sum, episode) => sum + episode.scenes.length, 0) ?? 0,
    [production],
  );

  function changeProduction(next: ProductionDocument) {
    if (!project) return;
    onProjectChange({ ...project, production: next, updatedAt: new Date().toISOString() });
  }

  function createEditableDraft() {
    if (!project) return;
    const next = productionFromProject(project);
    onProjectChange({
      ...project,
      production: next,
      productionHistory: [],
      updatedAt: new Date().toISOString(),
    });
    setStatus("可编辑稿已建立");
  }

  async function generateWithProvider() {
    if (!project || !validation.valid || isGenerating) return;
    const controller = new AbortController();
    requestController.current = controller;
    setIsGenerating(true);
    setStatus("生成服务正在编写 Story Bible 与分集场景");
    onProjectChange({
      ...project,
      steps: updateAllSteps(project.steps, "running"),
      status: "running",
    });
    try {
      const document = await requestProductionDocument(
        providerConfig,
        { title: project.title, sourceText: project.sourceText },
        controller.signal,
      );
      onProjectChange({
        ...project,
        production: document,
        productionHistory: [],
        status: "completed",
        steps: updateAllSteps(project.steps, "completed"),
        updatedAt: new Date().toISOString(),
      });
      setStatus("可编辑剧集方案已生成");
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败";
      onProjectChange({
        ...project,
        status: "failed",
        steps: updateAllSteps(project.steps, "failed", message),
        error: message,
      });
      setStatus(message.replace(/^[A-Z_]+：/, ""));
    } finally {
      requestController.current = null;
      setIsGenerating(false);
    }
  }

  function cancelGeneration() {
    requestController.current?.abort();
  }

  function saveVersion() {
    if (!project || !production) return;
    const saved = saveProductionVersion(production, history, versionLabel);
    onProjectChange({
      ...project,
      production: saved.document,
      productionHistory: saved.history,
      updatedAt: saved.document.updatedAt,
    });
    setVersionLabel("");
    setStatus(`版本 v${saved.document.version} 已保存`);
  }

  function restoreVersion(versionId: string) {
    if (!project) return;
    const restored = restoreProductionVersion(history, versionId);
    onProjectChange({
      ...project,
      production: restored.document,
      productionHistory: restored.history,
      updatedAt: restored.document.updatedAt,
    });
    setStatus(`已恢复为 v${restored.document.version}`);
  }

  async function exportCurrent(kind: ExportKind) {
    if (!project || !production || exporting) return;
    const base = safeFilename(production.storyBible.title || project.title);
    setExporting(kind);
    setStatus(`正在生成 ${kind.toUpperCase()}`);
    try {
      if (kind === "fountain") {
        downloadText(`${base}.fountain`, "text/plain", buildFountain(production));
      } else if (kind === "srt") {
        downloadText(`${base}.srt`, "application/x-subrip", buildSrt(production));
      } else if (kind === "docx") {
        downloadBlob(`${base}.docx`, await buildDocxBlob(production));
      } else if (kind === "pdf") {
        downloadBlob(`${base}.pdf`, await buildPdfBlob(production));
      } else {
        const [docx, pdf] = await Promise.all([
          buildDocxBlob(production),
          buildPdfBlob(production),
        ]);
        const archive = await buildProjectArchive({
          projectTitle: project.title,
          sourceText: project.sourceText,
          production,
          docxBytes: new Uint8Array(await docx.arrayBuffer()),
          pdfBytes: new Uint8Array(await pdf.arrayBuffer()),
        });
        downloadBlob(`${base}-project.zip`, archive);
      }
      setStatus(`${kind.toUpperCase()} 已生成`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(null);
    }
  }

  return (
    <section id="production" className="mx-auto max-w-[1600px] space-y-5 px-4 pb-6 sm:px-6">
      <ProviderPanel
        config={providerConfig}
        isOpen={providerOpen}
        onChange={setProviderConfig}
        onToggle={() => setProviderOpen((value) => !value)}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
              Production
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">创作编辑器</h2>
            <p className="mt-2 text-xs text-slate-500">
              {production
                ? `v${production.version} · ${production.episodes.length} 集 · ${sceneCount} 场`
                : "Story Bible、分集与场景会保存在当前项目"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!production ? (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40"
                type="button"
                disabled={!project}
                onClick={createEditableDraft}
              >
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                建立可编辑稿
              </button>
            ) : null}
            {isGenerating ? (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white"
                type="button"
                onClick={cancelGeneration}
              >
                <CircleStop className="h-4 w-4" aria-hidden="true" />
                取消生成
              </button>
            ) : (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                type="button"
                disabled={!project || !validation.valid}
                onClick={() => void generateWithProvider()}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                生成剧集方案
              </button>
            )}
          </div>
        </div>

        {production ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex gap-1">
                <button
                  className={`rounded-xl px-3 py-2 text-xs font-medium ${
                    editorTab === "story" ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                  type="button"
                  onClick={() => setEditorTab("story")}
                >
                  Story Bible
                </button>
                <button
                  className={`rounded-xl px-3 py-2 text-xs font-medium ${
                    editorTab === "episodes" ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                  type="button"
                  onClick={() => setEditorTab("episodes")}
                >
                  分集与场景
                </button>
              </div>
              <div className="flex min-w-0 flex-1 justify-end gap-2 sm:flex-none">
                <input
                  aria-label="版本说明"
                  className="h-9 min-w-0 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 sm:w-44"
                  placeholder="版本说明"
                  value={versionLabel}
                  onChange={(event) => setVersionLabel(event.target.value)}
                />
                <button
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white"
                  type="button"
                  onClick={saveVersion}
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  保存版本
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {editorTab === "story" ? (
                <StoryEditor production={production} onChange={changeProduction} />
              ) : (
                <EpisodesEditor production={production} onChange={changeProduction} />
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <FileJson2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">从当前结构继续创作</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
              先建立可编辑稿，或连接生成服务生成带原著来源的 Story Bible、分集与场景。
            </p>
          </div>
        )}
      </section>

      {production ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-violet-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">正式导出</h2>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              导出当前编辑内容、原著引用与项目资料。
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(
                [
                  ["fountain", "Fountain", FileText],
                  ["docx", "DOCX", FileText],
                  ["pdf", "PDF", FileText],
                  ["srt", "SRT", Film],
                  ["zip", "项目 ZIP", Archive],
                ] as const
              ).map(([kind, label, Icon]) => (
                <button
                  key={kind}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                  type="button"
                  disabled={Boolean(exporting)}
                  onClick={() => void exportCurrent(kind)}
                >
                  {exporting === kind ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-violet-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">版本历史</h2>
            </div>
            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
              {history
                .slice()
                .reverse()
                .map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-800">
                        v{version.version} · {version.label}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {new Date(version.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <button
                      aria-label={`恢复版本 ${version.version}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] text-slate-600 hover:border-violet-300 hover:text-violet-700"
                      type="button"
                      onClick={() => restoreVersion(version.id)}
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      恢复
                    </button>
                  </div>
                ))}
              {!history.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                  保存版本后可在这里恢复
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">媒体生产</h2>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              连接媒体服务并添加素材后，可生成角色图、配音、视频并进行预演。
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
            媒体服务未连接
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["生成角色图", "生成配音", "生成视频", "播放 Animatic"].map((label) => (
            <button
              key={label}
              className="h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400"
              type="button"
              disabled
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div aria-live="polite" className="flex items-center gap-2 px-1 text-xs text-slate-500">
        {isGenerating || exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        )}
        {status}
      </div>
    </section>
  );
}
