"use client";

import {
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clapperboard,
  Clock3,
  Download,
  FileText,
  Film,
  FolderOpen,
  Layers3,
  Loader2,
  LockKeyhole,
  Play,
  Sparkles,
  Upload,
  UserPlus,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductionWorkspace } from "@/components/production-workspace";
import { createInitialSteps } from "@/lib/workflow/agents";
import {
  exportProjectAsCsv,
  exportProjectAsJson,
  exportProjectAsMarkdown,
} from "@/lib/workflow/exporters";
import { buildFallbackWorkflowResult } from "@/lib/workflow/fallback";
import type {
  AgentStep,
  CharacterCard,
  Project,
  SceneCard,
  ShotCard,
  TimelineItem,
} from "@/lib/workflow/types";

type ResultTab = "structure" | "characters" | "scenes" | "shots" | "timeline";
type ExportFormat = "md" | "json" | "csv";
type AccountMode = "login" | "register" | null;

const IS_BROWSER_MODE = process.env.NEXT_PUBLIC_BROWSER_DEMO === "1";
const LOCAL_PROJECT_PREFIX = "local-";
const LOCAL_PROJECTS_KEY = "chuangju.projects.v1";
const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
const SAMPLE_TITLE = "雨夜归途";
const SAMPLE_SOURCE_TEXT =
  "雨夜，林澈回到旧城，发现父亲留下的录音。好友阿岚提醒他别追查，但他决定去废弃剧院寻找真相。剧院深处，一盏旧灯忽然亮起，录音里传出母亲的名字。黑衣人现身阻止他，阿岚被迫说出当年的秘密。黎明前，林澈站上废弃舞台，终于明白父亲真正想保护的人是谁。";

const resultTabs: Array<{ id: ResultTab; label: string }> = [
  { id: "structure", label: "剧本结构" },
  { id: "characters", label: "人物卡" },
  { id: "scenes", label: "场景卡" },
  { id: "shots", label: "镜头表" },
  { id: "timeline", label: "时序草案" },
];

const productionStages = ["原著", "剧情拆解", "分集规划", "标准剧本", "可编辑分镜", "交付包"];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function readLocalProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_PROJECTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Project =>
        Boolean(
          item &&
            typeof item === "object" &&
            "id" in item &&
            typeof item.id === "string" &&
            "title" in item &&
            typeof item.title === "string" &&
            "sourceText" in item &&
            typeof item.sourceText === "string",
        ),
    );
  } catch {
    return [];
  }
}

function persistLocalProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects.slice(0, 24)));
  } catch {
    // A full or unavailable browser store must not block the active editing session.
  }
}

function createLocalDraftProject(title: string, sourceText: string): Project {
  const now = new Date().toISOString();
  return {
    id: `${LOCAL_PROJECT_PREFIX}${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    title: title.trim() || "未命名项目",
    sourceText: sourceText.trim(),
    status: "completed",
    modelConfig: { model: "local-structure" },
    steps: createInitialSteps(),
    results: buildFallbackWorkflowResult({
      title: title.trim() || "未命名项目",
      sourceText,
    }),
    createdAt: now,
    updatedAt: now,
  };
}

function isLocalProject(project: Project) {
  return project.id.startsWith(LOCAL_PROJECT_PREFIX);
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

function exportLocalProject(project: Project, format: ExportFormat) {
  const baseName = project.title.trim() || "chuangju-project";
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

function AccountDialog({ mode, onClose }: { mode: AccountMode; onClose: () => void }) {
  useEffect(() => {
    if (!mode) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mode, onClose]);

  if (!mode) return null;
  const title = mode === "login" ? "登录创作空间" : "创建创作空间";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        aria-label="关闭账号窗口"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />
      <section
        aria-labelledby="account-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <button
          aria-label="关闭"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
          type="button"
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="account-title" className="mt-5 text-xl font-semibold text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          账号与团队协作服务尚未开放。当前项目仍可在本设备创建、保存与导出。
        </p>
        <button
          className="mt-6 h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white"
          type="button"
          onClick={onClose}
        >
          返回工作台
        </button>
      </section>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function StructureView({ project }: { project: Project | null }) {
  const structure = project?.results?.scriptStructure;
  if (!structure) {
    return (
      <EmptyPanel
        icon={Layers3}
        title="等待原著"
        description="粘贴或上传原著后，先整理叙事节点，再继续人物、场景和分镜创作。"
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
              {structure.genre}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {structure.title}
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {project?.modelConfig.model === "local-structure" ? "结构草案" : "AI 版本"}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600">{structure.logline}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {structure.themes.map((theme) => (
            <span key={theme} className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700">
              {theme}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        {structure.acts.map((act, index) => (
          <article key={act.name} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 font-mono text-xs text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-sm font-semibold text-slate-950">{act.name}</h3>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">{act.purpose}</p>
            <ol className="mt-4 space-y-2">
              {act.beats.length ? (
                act.beats.map((beat, beatIndex) => (
                  <li key={`${beat}-${beatIndex}`} className="flex gap-2 text-xs leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span>{beat}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400">当前原著没有更多可拆分节点</li>
              )}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}

function CharacterView({ characters }: { characters?: CharacterCard[] }) {
  if (!characters?.length) {
    return (
      <EmptyPanel
        icon={BookOpenText}
        title="人物仍待确认"
        description="结构整理不会猜测人物身份。连接生成服务后可依据原文提取人物候选，再由你确认。"
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {characters.map((character) => (
        <article key={character.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">{character.name}</h3>
              <p className="mt-1 text-xs text-violet-600">{character.role}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">候选</span>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-600">{character.profile}</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
            <strong className="text-slate-800">目标：</strong>
            {character.goal}
          </div>
        </article>
      ))}
    </div>
  );
}

function SceneView({ scenes }: { scenes?: SceneCard[] }) {
  if (!scenes?.length) {
    return (
      <EmptyPanel
        icon={Film}
        title="场景仍待拆分"
        description="结构整理只保留原文节点，不会补写地点、时间和美术设定。"
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {scenes.map((scene) => (
        <article key={scene.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-violet-600">
            {scene.time} · {scene.location}
          </div>
          <h3 className="mt-2 font-semibold text-slate-950">{scene.name}</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">{scene.mood}</p>
          <ul className="mt-4 space-y-2">
            {scene.keyEvents.map((event) => (
              <li key={event} className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                {event}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function ShotsView({ shots }: { shots?: ShotCard[] }) {
  if (!shots?.length) {
    return (
      <EmptyPanel
        icon={Clapperboard}
        title="镜头表为空"
        description="完成结构整理后，原文节点会进入镜头工作表，供你继续设计景别与运镜。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[72px_130px_1fr_90px_90px_70px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
        <span>镜号</span>
        <span>场景</span>
        <span>原文节点 / 画面</span>
        <span>景别</span>
        <span>运镜</span>
        <span>时长</span>
      </div>
      {shots.map((shot) => (
        <article
          key={shot.id}
          className="grid gap-3 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[72px_130px_1fr_90px_90px_70px]"
        >
          <span className="font-mono text-xs font-semibold text-violet-700">{shot.shotNumber}</span>
          <span className="text-xs text-slate-500">{shot.scene}</span>
          <p className="text-xs leading-6 text-slate-700">{shot.visual}</p>
          <span className="text-xs text-slate-500">{shot.shotSize}</span>
          <span className="text-xs text-slate-500">{shot.cameraMove}</span>
          <span className="font-mono text-xs text-slate-500">{shot.durationSeconds}s</span>
        </article>
      ))}
    </div>
  );
}

function TimelineView({ items, total }: { items?: TimelineItem[]; total?: number }) {
  if (!items?.length) {
    return (
      <EmptyPanel
        icon={Clock3}
        title="时序草案为空"
        description="这里会展示镜头顺序与估算时长；只有存在真实媒体时才会进入可播放预演。"
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <div className="text-xs text-slate-500">估算总时长</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">
            {formatDuration(total ?? 0)}
          </div>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          暂无媒体
        </span>
      </section>
      {items.map((item) => {
        const duration = item.endSeconds - item.startSeconds;
        return (
          <article key={item.shotNumber} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="w-10 font-mono text-xs font-semibold text-violet-700">
                {item.shotNumber}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${Math.max(8, (duration / (total || 1)) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-slate-500">
                {item.startSeconds}s–{item.endSeconds}s
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-700">{item.subtitle}</p>
          </article>
        );
      })}
    </div>
  );
}

function StepStatus({ step }: { step: AgentStep }) {
  if (step.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        已完成
      </span>
    );
  }
  if (step.status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-violet-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        处理中
      </span>
    );
  }
  if (step.status === "failed") return <span className="text-rose-600">失败</span>;
  return <span className="text-slate-400">待连接</span>;
}

export function Workbench() {
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [sourceText, setSourceText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>(createInitialSteps());
  const [activeTab, setActiveTab] = useState<ResultTab>("structure");
  const [isRunning, setIsRunning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("导入原著，开始整理");
  const [accountMode, setAccountMode] = useState<AccountMode>(null);

  const results = project?.results;
  const canRun = sourceText.trim().length > 0 && !isRunning;
  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.round(steps.reduce((sum, step) => sum + step.progress, 0) / steps.length);
  }, [steps]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const localProjects = readLocalProjects();
      setProjects(localProjects);
      if (localProjects[0]) {
        const latest = localProjects[0];
        setProject(latest);
        setTitle(latest.title);
        setSourceText(latest.sourceText);
        setSteps(latest.steps);
        setMessage(`已恢复 ${latest.title}`);
      }
    });

    if (IS_BROWSER_MODE) {
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/projects")
      .then(async (response) => {
        if (!response.ok) throw new Error("项目列表读取失败");
        return (await response.json()) as { projects?: Project[] };
      })
      .then((payload) => {
        const remoteProjects = payload.projects ?? [];
        if (!remoteProjects.length) return;
        setProjects((current) => {
          const knownIds = new Set(remoteProjects.map((item) => item.id));
          return [...remoteProjects, ...current.filter((item) => !knownIds.has(item.id))];
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  function mergeProject(nextProject: Project) {
    setProject(nextProject);
    setProjects((current) => {
      const next = [nextProject, ...current.filter((item) => item.id !== nextProject.id)];
      persistLocalProjects(next);
      return next;
    });
  }

  function loadSample() {
    setTitle(SAMPLE_TITLE);
    setSourceText(SAMPLE_SOURCE_TEXT);
    setProject(null);
    setSteps(createInitialSteps());
    setActiveTab("structure");
    setMessage("示例已载入");
  }

  async function handleFile(file: File) {
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setMessage("文件超过 10MB，请拆分后再导入");
      return;
    }

    const extension = file.name.toLowerCase().split(".").pop();
    if (!["txt", "md", "docx"].includes(extension ?? "")) {
      setMessage("请选择 TXT、Markdown 或 DOCX 文件");
      return;
    }

    setIsUploading(true);
    setMessage("正在读取原著");
    try {
      let text = "";
      if (extension === "docx") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
        if (!text.trim()) throw new Error("DOCX 中没有可读取的文本");
      } else {
        text = await file.text();
      }

      setSourceText(text);
      if (!title.trim() || title === SAMPLE_TITLE) {
        setTitle(file.name.replace(/\.(txt|md|docx)$/i, ""));
      }
      setProject(null);
      setSteps(createInitialSteps());
      setMessage(`已导入 ${file.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文件读取失败");
    } finally {
      setIsUploading(false);
    }
  }

  function createStructureDraft() {
    if (!canRun) return;
    setIsRunning(true);
    const localProject = createLocalDraftProject(title, sourceText);
    mergeProject(localProject);
    setSteps(localProject.steps);
    setActiveTab("structure");
    setMessage("结构草案已生成");
    setIsRunning(false);
  }

  function exportProject(format: ExportFormat) {
    if (!project?.results) return;
    if (isLocalProject(project)) {
      exportLocalProject(project, format);
      return;
    }
    window.location.assign(`/api/projects/${project.id}/export?format=${format}`);
  }

  function loadProject(item: Project) {
    setProject(item);
    setTitle(item.title);
    setSourceText(item.sourceText);
    setSteps(item.steps);
    setActiveTab("structure");
    setMessage(`已打开 ${item.title}`);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f1ec] text-slate-900">
      <AccountDialog mode={accountMode} onClose={() => setAccountMode(null)} />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121116]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-950/30">
              <Wand2 className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">创剧AI</div>
              <div className="hidden text-[10px] uppercase tracking-[0.22em] text-white/40 sm:block">
                pre-production studio
              </div>
            </div>
          </div>

          <nav aria-label="主导航" className="hidden flex-1 items-center gap-1 md:flex">
            <a className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white" href="#workbench">
              改编台
            </a>
            <a className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white" href="#pipeline">
              制作管线
            </a>
            <a className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white" href="#production">
              创作编辑器
            </a>
            <a className="rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white" href="#projects">
              项目
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <a
              className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:border-violet-300/40 hover:text-white lg:inline-flex"
              href="#production"
            >
              <CircleDot className="h-3 w-3 text-amber-400" />
              生成服务设置
            </a>
            <button
              className="h-9 rounded-lg px-3 text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => setAccountMode("login")}
            >
              登录
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-950 hover:bg-violet-50"
              type="button"
              onClick={() => setAccountMode("register")}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              注册
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200/70 bg-[#121116] text-white">
        <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                小说改剧 · 前期制片工作台
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                把原著变成可执行的短剧方案
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                从原文节点开始，逐步完成剧情结构、人物、场景、镜头与时序交付。
              </p>
            </div>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
              {productionStages.map((stage, index) => (
                <div key={stage} className="flex shrink-0 items-center">
                  <span
                    className={`rounded-full px-3 py-1.5 text-[11px] ${
                      index === 0 ? "bg-white text-slate-950" : "border border-white/10 text-white/55"
                    }`}
                  >
                    {stage}
                  </span>
                  {index < productionStages.length - 1 ? (
                    <ChevronRight className="mx-1 h-3.5 w-3.5 text-white/20" aria-hidden="true" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="workbench" className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.22fr)]">
        <section className="self-start overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:sticky xl:top-22">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Source</div>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">导入原著</h2>
              </div>
              <button
                className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700"
                type="button"
                onClick={loadSample}
              >
                载入示例
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-600">项目名称</span>
              <input
                aria-label="项目名称"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                placeholder="输入项目名称"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label
              className="group flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-violet-400 hover:bg-violet-50/50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" aria-hidden="true" />
              ) : (
                <Upload className="h-6 w-6 text-slate-400 group-hover:text-violet-600" aria-hidden="true" />
              )}
              <span className="mt-2 text-xs font-semibold text-slate-700">
                {isUploading ? "正在读取" : "拖入原著或点击选择"}
              </span>
              <span className="mt-1 text-[11px] text-slate-400">TXT · Markdown · DOCX，最大 10MB</span>
              <input
                className="sr-only"
                type="file"
                accept=".txt,.md,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
                <span>原著内容</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {sourceText.trim().length.toLocaleString()} 字
                </span>
              </span>
              <textarea
                className="min-h-72 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                placeholder="粘贴小说文本内容..."
                value={sourceText}
                onChange={(event) => {
                  setSourceText(event.target.value);
                  setProject(null);
                  setSteps(createInitialSteps());
                }}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                type="button"
                disabled={!canRun}
                onClick={createStructureDraft}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Layers3 className="h-4 w-4" aria-hidden="true" />
                )}
                整理结构草案
              </button>
              <a
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 ${
                  project ? "" : "pointer-events-none border-slate-200 bg-slate-50 text-slate-400"
                }`}
                aria-disabled={!project}
                href="#production"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                继续创作
              </a>
            </div>
            <div aria-live="polite" className="flex items-center gap-2 text-xs text-slate-500">
              <CircleDot className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
              {message}
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-[#fbfbfc] shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Workspace</div>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">改编成果</h2>
              </div>
              <div className="flex items-center gap-2">
                {(["md", "json", "csv"] as const).map((format) => (
                  <button
                    key={format}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
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
            <div className="mt-4 overflow-x-auto">
              <div className="flex min-w-max gap-1">
                {resultTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                      activeTab === tab.id
                        ? "bg-slate-950 text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === "structure" ? <StructureView project={project} /> : null}
            {activeTab === "characters" ? <CharacterView characters={results?.characters} /> : null}
            {activeTab === "scenes" ? <SceneView scenes={results?.scenes} /> : null}
            {activeTab === "shots" ? <ShotsView shots={results?.shots} /> : null}
            {activeTab === "timeline" ? (
              <TimelineView items={results?.timeline.items} total={results?.timeline.totalDurationSeconds} />
            ) : null}
          </div>
        </section>
      </div>

      <ProductionWorkspace
        project={project}
        onProjectChange={(nextProject) => {
          mergeProject(nextProject);
          setSteps(nextProject.steps);
        }}
      />

      <section id="pipeline" className="mx-auto max-w-[1600px] px-4 pb-6 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Pipeline</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">AI 制作管线</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                连接生成服务后，可按制作阶段生成、审阅并完善内容。
              </p>
            </div>
            <div className="font-mono text-sm text-slate-400">{progress}%</div>
          </div>
          <div className="grid gap-px bg-slate-100 md:grid-cols-2 xl:grid-cols-7">
            {steps.map((step, index) => (
              <article key={step.id} className="min-h-36 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-sm font-semibold text-slate-900">{step.name}</h3>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">{step.description}</p>
                <div className="mt-4 text-[11px] font-medium">
                  <StepStatus step={step} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {projects.length ? (
        <section id="projects" className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-violet-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">最近项目</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.slice(0, 8).map((item) => (
              <button
                key={item.id}
                aria-label={`打开 ${item.title}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-950/5"
                type="button"
                onClick={() => loadProject(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-400">
                    {isLocalProject(item) ? "结构草案" : item.status}
                  </span>
                </div>
                <h3 className="mt-4 truncate text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {item.sourceText.length.toLocaleString()} 字 · {item.results?.shots.length ?? 0} 个节点
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{message}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-violet-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-950 disabled:opacity-40"
            type="button"
            disabled={!canRun}
            onClick={createStructureDraft}
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            整理草案
          </button>
        </div>
      </div>
    </main>
  );
}
