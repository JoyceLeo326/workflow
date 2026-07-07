"use client";

import {
  Boxes,
  CheckCircle2,
  Clapperboard,
  Download,
  ExternalLink,
  Film,
  FolderKanban,
  Grid3X3,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  MapPinned,
  Play,
  RefreshCw,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  UsersRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { INSPIRATION_SOURCES } from "@/lib/inspiration/sources";
import { createInitialSteps } from "@/lib/workflow/agents";
import { exportProjectAsCsv, exportProjectAsJson, exportProjectAsMarkdown } from "@/lib/workflow/exporters";
import { buildFallbackWorkflowResult } from "@/lib/workflow/fallback";
import type {
  AgentStep,
  CharacterCard,
  Project,
  RunEvent,
  SceneCard,
  ShotCard,
  TimelineItem,
} from "@/lib/workflow/types";

type ResultTab = "structure" | "characters" | "scenes" | "shots" | "timeline";
type ExportFormat = "md" | "json" | "csv";

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "工作台",
    items: [{ label: "工作台", icon: LayoutDashboard }],
  },
  {
    label: "剧本大师",
    items: [{ label: "小说改剧", icon: ScrollText, active: true }],
  },
  {
    label: "项目管理",
    items: [
      { label: "项目管理", icon: FolderKanban },
      { label: "剧本生成", icon: Clapperboard },
      { label: "角色设计", icon: UsersRound },
      { label: "场景设计", icon: ImageIcon },
      { label: "导演故事板", icon: Grid3X3 },
      { label: "分镜制作", icon: Film },
      { label: "成片预览", icon: Play },
    ],
  },
  {
    label: "资产管理",
    items: [{ label: "资产管理", icon: Boxes }],
  },
  {
    label: "系统设置",
    items: [{ label: "系统设置", icon: Settings }],
  },
];

const tabs: Array<{ id: ResultTab; label: string }> = [
  { id: "structure", label: "剧本结构" },
  { id: "characters", label: "角色列表" },
  { id: "scenes", label: "场景列表" },
  { id: "shots", label: "分镜大纲" },
  { id: "timeline", label: "成片预演" },
];

const BROWSER_DEMO_PREFIX = "demo-";
const IS_BROWSER_DEMO_MODE = process.env.NEXT_PUBLIC_BROWSER_DEMO === "1";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function StepIcon({ step }: { step: AgentStep }) {
  if (step.status === "completed") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  }

  if (step.status === "running") {
    return <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />;
  }

  return <Sparkles className="h-5 w-5 text-slate-400" aria-hidden="true" />;
}

function EmptyResult() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center text-slate-500">
      <Grid3X3 className="h-8 w-8 text-slate-300" aria-hidden="true" />
      <div className="text-sm font-medium text-slate-600">暂无剧本结构</div>
      <p className="max-w-sm text-xs leading-6">导入小说并开始转换后，系统会在这里展示结构化结果。</p>
    </div>
  );
}

function StructureView({ project }: { project: Project }) {
  const structure = project.results?.scriptStructure;
  if (!structure) return <EmptyResult />;

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="text-xs font-medium text-blue-600">{structure.genre}</div>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{structure.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{structure.logline}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {structure.themes.map((theme) => (
            <span key={theme} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
              {theme}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {structure.acts.map((act) => (
          <article key={act.name} className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-950">{act.name}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">{act.purpose}</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
              {act.beats.map((beat) => (
                <li key={beat} className="border-l-2 border-blue-200 pl-2">
                  {beat}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function CharacterView({ characters }: { characters?: CharacterCard[] }) {
  if (!characters?.length) return <EmptyResult />;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {characters.map((character) => (
        <article key={character.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">{character.name}</h3>
              <p className="text-xs text-slate-500">{character.role}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">{character.profile}</p>
          <dl className="mt-3 space-y-2 text-xs leading-5">
            <div>
              <dt className="font-medium text-slate-800">目标</dt>
              <dd className="text-slate-600">{character.goal}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">视觉提示词</dt>
              <dd className="font-mono text-[11px] text-slate-500">{character.visualPrompt}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function SceneView({ scenes }: { scenes?: SceneCard[] }) {
  if (!scenes?.length) return <EmptyResult />;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {scenes.map((scene) => (
        <article key={scene.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            {scene.time} / {scene.location}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-950">{scene.name}</h3>
          <p className="mt-2 text-xs text-slate-600">{scene.mood}</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
            {scene.keyEvents.map((event) => (
              <li key={event} className="rounded-md bg-slate-50 p-2">
                {event}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-[11px] leading-5 text-slate-500">{scene.visualPrompt}</p>
        </article>
      ))}
    </div>
  );
}

function ShotsView({ shots }: { shots?: ShotCard[] }) {
  if (!shots?.length) return <EmptyResult />;

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="grid grid-cols-[72px_120px_1fr_90px_90px_80px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 max-lg:hidden">
        <span>镜号</span>
        <span>场景</span>
        <span>画面</span>
        <span>景别</span>
        <span>运镜</span>
        <span>时长</span>
      </div>
      {shots.map((shot) => (
        <article
          key={shot.id}
          className="grid gap-2 border-b border-slate-100 px-3 py-3 text-sm last:border-b-0 lg:grid-cols-[72px_120px_1fr_90px_90px_80px]"
        >
          <span className="font-mono text-xs font-semibold text-blue-700">{shot.shotNumber}</span>
          <span className="text-xs text-slate-700">{shot.scene}</span>
          <div>
            <p className="text-xs leading-5 text-slate-700">{shot.visual}</p>
            <p className="mt-1 text-xs text-slate-500">{shot.subtitle}</p>
          </div>
          <span className="text-xs text-slate-600">{shot.shotSize}</span>
          <span className="text-xs text-slate-600">{shot.cameraMove}</span>
          <span className="text-xs text-slate-600">{shot.durationSeconds}s</span>
        </article>
      ))}
    </div>
  );
}

function TimelineView({ items, total }: { items?: TimelineItem[]; total?: number }) {
  if (!items?.length) return <EmptyResult />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
        <div>
          <div className="text-xs font-medium text-slate-500">成片预演总时长</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">
            {formatDuration(total ?? 0)}
          </div>
        </div>
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          可继续接入图片、配音、剪辑 API
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.shotNumber} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-blue-700">{item.shotNumber}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.max(8, ((item.endSeconds - item.startSeconds) / (total || 1)) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-slate-500">
                {item.startSeconds}s-{item.endSeconds}s
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-700">{item.subtitle}</p>
            <p className="mt-1 font-mono text-[11px] leading-5 text-slate-500">{item.visualPrompt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function createCompletedSteps(): AgentStep[] {
  const now = new Date().toISOString();
  return createInitialSteps().map((step) => ({
    ...step,
    status: "completed",
    progress: 100,
    startedAt: now,
    completedAt: now,
  }));
}

function createBrowserDemoProject(title: string, sourceText: string, model: string): Project {
  const now = new Date().toISOString();
  const safeTitle = title.trim() || "未命名项目";
  return {
    id: `${BROWSER_DEMO_PREFIX}${globalThis.crypto?.randomUUID?.() ?? now}`,
    title: safeTitle,
    sourceText: sourceText.trim(),
    status: "completed",
    modelConfig: { model },
    steps: createCompletedSteps(),
    results: buildFallbackWorkflowResult({ title: safeTitle, sourceText }),
    createdAt: now,
    updatedAt: now,
  };
}

function isBrowserDemoProject(project: Project): boolean {
  return project.id.startsWith(BROWSER_DEMO_PREFIX);
}

function downloadTextFile(filename: string, contentType: string, content: string) {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportBrowserDemoProject(project: Project, format: ExportFormat) {
  const baseName = project.title.trim() || "workflow-project";
  if (format === "json") {
    downloadTextFile(`${baseName}.json`, "application/json", exportProjectAsJson(project));
    return;
  }
  if (format === "csv") {
    downloadTextFile(`${baseName}.csv`, "text/csv", exportProjectAsCsv(project));
    return;
  }
  downloadTextFile(`${baseName}.md`, "text/markdown", exportProjectAsMarkdown(project));
}

function InspirationMatrix() {
  return (
    <section className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-base font-semibold">合规复刻矩阵</h2>
        </div>
        <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
          只借鉴产品模式，不复制源码或素材
        </span>
      </div>
      <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {INSPIRATION_SOURCES.map((source) => (
          <article key={source.name} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <a
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950 hover:text-blue-700"
                  href={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="mt-1 text-xs leading-5 text-slate-500">{source.description}</p>
              </div>
              <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                {source.license}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-xs leading-5">
              <div>
                <dt className="font-medium text-slate-800">借鉴模式</dt>
                <dd className="text-slate-600">{source.referencePattern}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">差异化重写</dt>
                <dd className="text-slate-600">{source.differentiation[0]}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 text-slate-500">
                <dt>Stars observed</dt>
                <dd className="font-mono">{source.starsObserved.toLocaleString()}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Workbench() {
  const [title, setTitle] = useState("雨夜归途");
  const [sourceText, setSourceText] = useState("");
  const [model, setModel] = useState("deepseek-chat");
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>(createInitialSteps());
  const [activeTab, setActiveTab] = useState<ResultTab>("structure");
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("准备就绪");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const progress = useMemo(() => {
    const total = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(total / steps.length);
  }, [steps]);

  useEffect(() => {
    if (IS_BROWSER_DEMO_MODE) {
      return;
    }

    fetch("/api/projects")
      .then((response) => response.json())
      .then((payload: { projects?: Project[] }) => {
        const loaded = payload.projects ?? [];
        setProjects(loaded);
        if (loaded[0]) {
          setProject(loaded[0]);
          setTitle(loaded[0].title);
          setSourceText(loaded[0].sourceText);
          setSteps(loaded[0].steps);
        }
      })
      .catch(() => {
        setProjects([]);
      });
  }, []);

  async function handleFile(file: File) {
    setIsUploading(true);
    setMessage("正在解析文件");

    if (IS_BROWSER_DEMO_MODE) {
      try {
        if (!file.name.toLowerCase().endsWith(".txt")) {
          throw new Error("公网演示支持 TXT 上传；DOCX 请在本地模式解析。");
        }
        setSourceText(await file.text());
        if (!title.trim() || title === "雨夜归途") {
          setTitle(file.name.replace(/\.txt$/i, ""));
        }
        setMessage("文件解析完成");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "文件解析失败");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/files/text", { method: "POST", body: form });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "文件解析失败");
      setSourceText(payload.text ?? "");
      if (!title.trim() || title === "雨夜归途") {
        setTitle(file.name.replace(/\.(txt|docx)$/i, ""));
      }
      setMessage("文件解析完成");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文件解析失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function startWorkflow() {
    if (!sourceText.trim() || isRunning) return;

    setIsRunning(true);
    setMessage("正在创建项目");
    setSteps(createInitialSteps());

    if (IS_BROWSER_DEMO_MODE) {
      const demoProject = createBrowserDemoProject(title, sourceText, model);
      mergeProject(demoProject);
      setSteps(demoProject.steps);
      setActiveTab("structure");
      setMessage("已生成本地演示结果");
      setIsRunning(false);
      return;
    }

    try {
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sourceText,
          modelConfig: {
            baseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
            model,
          },
        }),
      });
      const createPayload = (await createResponse.json()) as { project?: Project; error?: string };
      if (!createResponse.ok || !createPayload.project) {
        throw new Error(createPayload.error ?? "项目创建失败");
      }

      mergeProject(createPayload.project);
      setMessage("Agent 正在处理");

      const runResponse = await fetch(`/api/projects/${createPayload.project.id}/run`, {
        method: "POST",
      });
      if (!runResponse.body) throw new Error("浏览器不支持流式响应");

      const reader = runResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as RunEvent;
          if ("project" in event && event.project) {
            mergeProject(event.project);
            setSteps(event.project.steps);
          }
          if (event.type === "step") {
            setMessage(`${event.step.name}：${event.step.status === "completed" ? "完成" : "处理中"}`);
          }
          if (event.type === "complete") {
            setMessage("工作流完成");
            setActiveTab("structure");
          }
          if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }
    } catch {
      const demoProject = createBrowserDemoProject(title, sourceText, model);
      mergeProject(demoProject);
      setSteps(demoProject.steps);
      setActiveTab("structure");
      setMessage("已生成本地演示结果");
    } finally {
      setIsRunning(false);
    }
  }

  function exportProject(format: ExportFormat) {
    if (!project) return;
    if (isBrowserDemoProject(project)) {
      exportBrowserDemoProject(project, format);
      return;
    }
    window.location.assign(`/api/projects/${project.id}/export?format=${format}`);
  }

  function mergeProject(nextProject: Project) {
    setProject(nextProject);
    setProjects((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== nextProject.id);
      return [nextProject, ...withoutDuplicate];
    });
  }

  const results = project?.results;

  return (
    <main className="flex min-h-screen bg-[#f6f7fb] text-slate-900">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <Wand2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-base font-semibold">创剧AI</div>
            <div className="text-xs text-slate-500">智能视频生成工作流</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <section key={group.label} className="mb-5">
              <div className="mb-2 px-2 text-xs font-medium text-slate-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                        item.active
                          ? "bg-slate-100 font-medium text-slate-950"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                      type="button"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            系统就绪
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">小说改剧</h1>
            <p className="mt-1 text-sm text-slate-500">将小说转化为短剧剧本、角色、场景、分镜和成片预演</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="模型选择"
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              <option value="deepseek-chat">DeepSeek - 通用推理</option>
              <option value="deepseek-reasoner">DeepSeek - 深度推理</option>
            </select>
          </div>
        </header>

        <div className="grid flex-1 gap-0 lg:grid-cols-[48%_52%]">
          <section className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r lg:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-slate-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">小说改剧</h2>
            </div>

            <label
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              <Upload className="h-7 w-7 text-slate-500" aria-hidden="true" />
              <span className="mt-3 text-sm font-medium text-slate-700">
                {isUploading ? "正在解析..." : "拖拽文件到此处上传"}
              </span>
              <span className="mt-1 text-xs text-slate-500">或点击选择文件，支持 .txt、.docx 格式</span>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept=".txt,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              或
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <input
              className="mb-3 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="项目标题"
            />
            <textarea
              className="min-h-[420px] w-full resize-none rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-500"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="粘贴小说文本内容..."
            />
            <button
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="button"
              disabled={!sourceText.trim() || isRunning}
              onClick={() => void startWorkflow()}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {isRunning ? "转换中" : "开始改剧"}
            </button>
          </section>

          <section className="flex min-w-0 flex-col">
            <div className="border-b border-slate-200 bg-[#f3f5f9] p-4 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-slate-700" aria-hidden="true" />
                  <h2 className="text-base font-semibold">Agent 处理管线</h2>
                </div>
                <div className="font-mono text-sm text-slate-500">{progress}%</div>
              </div>
              <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
                {steps.map((step, index) => (
                  <article key={step.id} className="relative rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-100 bg-slate-50">
                      <StepIcon step={step} />
                    </div>
                    <div className="mt-3 text-sm font-medium text-slate-900">{step.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {step.status === "completed"
                        ? "已完成"
                        : step.status === "running"
                          ? "处理中"
                          : "等待中"}
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="absolute -right-3 top-8 hidden text-slate-300 xl:block">›</div>
                    ) : null}
                  </article>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">{message}</div>
                <button
                  className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-50"
                  type="button"
                  disabled={!project}
                  onClick={() => {
                    if (project) {
                      setTitle(project.title);
                      setSourceText(project.sourceText);
                      setSteps(project.steps);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  载入当前项目
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col bg-[#f8fafc]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`h-9 whitespace-nowrap border-b-2 px-3 text-sm transition ${
                        activeTab === tab.id
                          ? "border-blue-600 font-medium text-blue-700"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(["md", "json", "csv"] as const).map((format) => (
                    <button
                      key={format}
                      className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 disabled:opacity-50"
                      type="button"
                      disabled={!project?.results}
                      onClick={() => exportProject(format)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 lg:p-6">
                {activeTab === "structure" ? <StructureView project={project ?? ({ title: "", sourceText: "", status: "draft", id: "", createdAt: "", updatedAt: "", modelConfig: {}, steps } as Project)} /> : null}
                {activeTab === "characters" ? <CharacterView characters={results?.characters} /> : null}
                {activeTab === "scenes" ? <SceneView scenes={results?.scenes} /> : null}
                {activeTab === "shots" ? <ShotsView shots={results?.shots} /> : null}
                {activeTab === "timeline" ? (
                  <TimelineView items={results?.timeline.items} total={results?.timeline.totalDurationSeconds} />
                ) : null}

                {projects.length ? (
                  <div className="mt-6">
                    <div className="mb-2 text-xs font-medium text-slate-500">最近项目</div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {projects.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          className="rounded-md border border-slate-200 bg-white p-3 text-left text-sm hover:border-blue-300"
                          type="button"
                          onClick={() => {
                            setProject(item);
                            setTitle(item.title);
                            setSourceText(item.sourceText);
                            setSteps(item.steps);
                            setMessage(`已载入 ${item.title}`);
                          }}
                        >
                          <div className="font-medium text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.status}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <InspirationMatrix />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
