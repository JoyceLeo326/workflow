"use client";

import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileText,
  FolderInput,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import {
  applyStoryFeedback,
  buildStoryDelivery,
  buildStoryDownloads,
  generateStoryCandidates,
  normalizeStoryBrief,
  type FeedbackIssue,
  type FeedbackMemory,
  type StoryAudience,
  type StoryBrief,
  type StoryCandidate,
  type StoryConstraint,
  type StoryDelivery,
  type StoryGenre,
  type StoryMinutes,
  type StoryMood,
  type StoryPace,
  type StoryPov,
  type StoryPriority,
} from "@/lib/story-studio/engine";
import { scenesForCandidate, type StoryScene } from "@/lib/story-studio/scenes";

const STORAGE_KEY = "chuangju.story-studio.v2";
const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
const DEFAULT_BRIEF = normalizeStoryBrief({
  sourceText:
    "雨夜，林澈回到旧城剧院。父亲留下的录音突然响起。阿岚劝他不要追查。林澈仍走上舞台。停电后，一封写着未来日期的信落在聚光灯下。",
});

type StoredStudio = {
  brief: StoryBrief;
  candidates: StoryCandidate[];
  selectedId: string | null;
  delivery: StoryDelivery | null;
  memory?: FeedbackMemory;
};

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[var(--ink-950)] outline-none transition focus:border-[var(--persimmon-500)] focus:ring-4 focus:ring-orange-100";

function saveStudio(state: StoredStudio) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The active session remains usable when browser storage is unavailable.
  }
}

function downloadFile(filename: string, content: string, contentType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${contentType};charset=utf-8` }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "chuangju-story";
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 text-xs font-medium text-black/60">
      {label}
      <select
        aria-label={label}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CandidateCard({
  candidate,
  scene,
  selected,
  onSelect,
}: {
  candidate: StoryCandidate;
  scene: StoryScene;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-[1.65rem] border p-5 transition ${
        selected
          ? "border-[var(--persimmon-500)] bg-[#fff8f1] shadow-[0_18px_60px_rgba(240,90,60,0.12)]"
          : "border-black/10 bg-white hover:border-black/25"
      }`}
      data-recommended={String(candidate.recommended)}
      data-testid={`candidate-${candidate.id}`}
    >
      <div className="-mx-5 -mt-5 mb-5 overflow-hidden bg-[var(--ink-950)]">
        <Image
          alt={scene.alt}
          className="h-44 w-full object-cover transition duration-500 hover:scale-[1.015] sm:h-52"
          data-testid="candidate-scene"
          height={800}
          loading="lazy"
          quality={78}
          sizes="(max-width: 1023px) 100vw, 50vw"
          src={scene.src}
          width={1280}
        />
        <div className="flex min-h-9 items-center justify-between gap-3 px-4 py-2 text-[10px] text-white/70">
          <span className="truncate">{scene.title}</span>
          <span className="shrink-0 text-[var(--jade-400)]">{scene.beat}</span>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/45">
              {candidate.badge}
            </span>
            {candidate.recommended ? (
              <span className="rounded-full bg-[var(--persimmon-500)] px-2.5 py-1 text-[10px] font-semibold text-white">
                当前推荐
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--ink-950)]">
            {candidate.title}
          </h3>
        </div>
        <div className="shrink-0 font-mono text-2xl font-semibold text-[var(--persimmon-600)]">
          {candidate.score}
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-black/65">{candidate.thesis}</p>
      <p className="mt-3 rounded-2xl bg-[var(--paper-50)] p-3 text-xs leading-6 text-black/60">
        {candidate.reason}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-3">
          <div className="text-[11px] font-semibold text-emerald-800">得到</div>
          <p className="mt-2 text-xs leading-6 text-emerald-950/70">{candidate.gain}</p>
        </div>
        <div className="rounded-2xl border border-orange-900/10 bg-orange-50/70 p-3">
          <div className="text-[11px] font-semibold text-orange-800">放弃</div>
          <p className="mt-2 text-xs leading-6 text-orange-950/70">{candidate.tradeoff}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-4">
        <span className="text-xs text-black/50">{candidate.production.summary}</span>
        <button
          aria-label={`选择 ${candidate.title}`}
          aria-pressed={selected}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
            selected
              ? "bg-[var(--ink-950)] text-white"
              : "border border-black/10 bg-white text-[var(--ink-950)] hover:border-[var(--persimmon-500)]"
          }`}
          type="button"
          onClick={onSelect}
        >
          {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
          {selected ? "已选择" : "选择路线"}
        </button>
      </div>
    </article>
  );
}

export function Workbench() {
  const [brief, setBrief] = useState<StoryBrief>(DEFAULT_BRIEF);
  const [candidates, setCandidates] = useState<StoryCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<StoryDelivery | null>(null);
  const [memory, setMemory] = useState<FeedbackMemory | undefined>();
  const [status, setStatus] = useState("内容保存在当前浏览器");
  const [feedbackScore, setFeedbackScore] = useState(3);
  const [feedbackIssue, setFeedbackIssue] = useState<FeedbackIssue>("钩子不够清楚");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );
  const deliveryScenes = useMemo(
    () =>
      delivery
        ? scenesForCandidate(delivery.decision.candidateId, delivery.brief.mood, 5)
        : [],
    [delivery],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as
          | StoredStudio
          | null;
        if (!stored?.brief || !Array.isArray(stored.candidates)) return;
        const restoredBrief = normalizeStoryBrief(stored.brief);
        const restoredCandidates = stored.memory
          ? generateStoryCandidates(restoredBrief, stored.memory)
          : stored.candidates;
        setBrief(restoredBrief);
        setCandidates(restoredCandidates);
        setSelectedId(stored.selectedId ?? null);
        setDelivery(stored.delivery ?? null);
        setMemory(stored.memory);
        if (stored.memory?.round) setStatus(`已恢复第 ${stored.memory.round} 轮创作判断`);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateBrief<K extends keyof StoryBrief>(key: K, value: StoryBrief[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
    setStatus("任务已改变，请重新生成路线");
  }

  async function handleSourceFile(file: File) {
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setStatus("文件超过 10MB，请拆分后再导入");
      return;
    }
    const extension = file.name.toLowerCase().split(".").pop();
    if (!["txt", "md", "docx"].includes(extension ?? "")) {
      setStatus("请选择 TXT、Markdown 或 DOCX 文件");
      return;
    }
    setIsReadingFile(true);
    try {
      const text =
        extension === "docx"
          ? (await import("mammoth")).extractRawText({ arrayBuffer: await file.arrayBuffer() })
          : { value: await file.text() };
      const value = (await text).value;
      updateBrief("sourceText", value);
      updateBrief("title", file.name.replace(/\.(txt|md|docx)$/i, ""));
      setStatus(`已读取 ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "文件读取失败");
    } finally {
      setIsReadingFile(false);
    }
  }

  function generateRoutes() {
    const normalized = normalizeStoryBrief(brief);
    const nextCandidates = generateStoryCandidates(normalized, memory);
    setBrief(normalized);
    setCandidates(nextCandidates);
    setSelectedId(null);
    setDelivery(null);
    setStatus(memory ? `第 ${memory.round} 轮路线已按反馈重排` : "四条路线已生成，请比较收益与代价");
    saveStudio({
      brief: normalized,
      candidates: nextCandidates,
      selectedId: null,
      delivery: null,
      memory,
    });
  }

  function selectCandidate(candidateId: string) {
    setSelectedId(candidateId);
    setStatus("路线已选择，确认后生成可编辑交付稿");
    saveStudio({ brief, candidates, selectedId: candidateId, delivery, memory });
  }

  function confirmCandidate() {
    if (!selectedCandidate) return;
    const nextDelivery = buildStoryDelivery(brief, selectedCandidate);
    setDelivery(nextDelivery);
    setStatus("路线已确认，交付稿可以编辑和下载");
    saveStudio({ brief, candidates, selectedId, delivery: nextDelivery, memory });
  }

  function updateDelivery(nextDelivery: StoryDelivery) {
    setDelivery(nextDelivery);
    saveStudio({ brief, candidates, selectedId, delivery: nextDelivery, memory });
  }

  function downloadDelivery(kind: "markdown" | "json") {
    if (!delivery) return;
    const files = buildStoryDownloads(delivery);
    const base = safeFilename(brief.title);
    if (kind === "markdown") {
      downloadFile(`${base}-第${delivery.version}版.md`, files.markdown, "text/markdown");
      setStatus("Markdown 交付稿已开始下载");
      return;
    }
    downloadFile(`${base}-第${delivery.version}版.json`, files.json, "application/json");
    setStatus("JSON 交付稿已开始下载");
  }

  function submitFeedback() {
    if (!delivery || !feedbackNote.trim()) return;
    const result = applyStoryFeedback(delivery, {
      score: feedbackScore,
      issue: feedbackIssue,
      note: feedbackNote,
    });
    const nextCandidates = generateStoryCandidates(brief, result.memory);
    setDelivery(result.delivery);
    setMemory(result.memory);
    setCandidates(nextCandidates);
    setSelectedId(null);
    setFeedbackNote("");
    setStatus("下一轮推荐已改变");
    saveStudio({
      brief,
      candidates: nextCandidates,
      selectedId: null,
      delivery: result.delivery,
      memory: result.memory,
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--paper-50)] text-[var(--ink-950)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--ink-950)]/96 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center gap-3 px-4 py-2 sm:px-6">
          <a className="flex min-h-11 min-w-0 items-center gap-3" href="#top" aria-label="创剧 AI 首页">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--paper-50)] text-[var(--ink-950)]">
              <BrandMark className="h-8 w-8" decorative />
            </span>
            <span className="min-w-0">
              <b className="block text-sm tracking-wide">创剧 AI</b>
              <small className="hidden text-[10px] uppercase tracking-[0.2em] text-white/45 sm:block">
                Story decision studio
              </small>
            </span>
          </a>
          <nav className="ml-5 hidden items-center gap-1 md:flex" aria-label="主导航">
            <a className="inline-flex min-h-11 items-center px-3 text-xs text-white/65 hover:text-white" href="#brief">
              写任务
            </a>
            <a className="inline-flex min-h-11 items-center px-3 text-xs text-white/65 hover:text-white" href="#candidates">
              比路线
            </a>
            <a className="inline-flex min-h-11 items-center px-3 text-xs text-white/65 hover:text-white" href="#delivery">
              做交付
            </a>
          </nav>
          <span className="ml-auto max-w-[48vw] truncate rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/65">
            {status}
          </span>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-[var(--ink-950)] text-white">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:py-20">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--jade-400)]/30 bg-[var(--jade-400)]/10 px-3 text-xs text-[var(--jade-400)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              原文证据 · 选择理由 · 制作代价
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
              让每个改编选择，
              <span className="text-[var(--persimmon-500)]">都有原文依据。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-8 text-white/58 sm:text-base">
              写下故事任务，比较四条真正不同的路线。你会先看见每条路线保留什么、牺牲什么，再确认一份可以编辑、下载并持续复盘的交付稿。
            </p>
            <a
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[var(--persimmon-500)] px-5 text-sm font-semibold text-white hover:bg-[var(--persimmon-600)]"
              href="#brief"
            >
              带着故事进去
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["01", "写下约束", "类型、受众、时长与制作限制一起进入判断"],
              ["02", "比较取舍", "候选顺序与理由随你的任务真实改变"],
              ["03", "反馈回流", "一次观察会改变下一轮推荐"],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <span className="font-mono text-xs text-[var(--jade-400)]">{number}</span>
                <h2 className="mt-5 text-sm font-semibold">{title}</h2>
                <p className="mt-2 text-xs leading-6 text-white/45">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="brief" className="mx-auto max-w-[1500px] scroll-mt-24 px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[.68fr_1.32fr]">
          <div className="self-start xl:sticky xl:top-24">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--persimmon-600)]">
              01 / Story brief
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">先说清，这一次为什么成立。</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-black/58">
              每个字段都会进入评分、排序、结构或制作计划。改一个属性，候选结果就要给出新的因果解释。
            </p>
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 text-xs leading-6 text-black/55">
              <div className="flex items-center gap-2 font-semibold text-[var(--ink-950)]">
                <ShieldCheck className="h-4 w-4 text-[var(--jade-400)]" aria-hidden="true" />
                无账号门槛
              </div>
              <p className="mt-2">核心判断在浏览器内完成，输入、选择和反馈默认只保存在本机。</p>
            </div>
          </div>

          <form
            className="min-w-0 rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(23,19,28,.07)] sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              generateRoutes();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block min-w-0 text-xs font-medium text-black/60">
                主创称呼
                <input
                  aria-label="主创称呼"
                  className={fieldClass}
                  maxLength={24}
                  value={brief.creator}
                  onChange={(event) => updateBrief("creator", event.target.value)}
                />
              </label>
              <label className="block min-w-0 text-xs font-medium text-black/60 sm:col-span-1 lg:col-span-2">
                项目名称
                <input
                  aria-label="项目名称"
                  className={fieldClass}
                  maxLength={48}
                  value={brief.title}
                  onChange={(event) => updateBrief("title", event.target.value)}
                />
              </label>
              <SelectField
                label="故事类型"
                value={brief.genre}
                options={["悬疑", "都市情感", "轻喜"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("genre", value as StoryGenre)}
              />
              <SelectField
                label="目标观众"
                value={brief.audience}
                options={["追更观众", "情感共鸣", "家庭共看"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("audience", value as StoryAudience)}
              />
              <SelectField
                label="单集时长"
                value={brief.minutes}
                options={[1, 3, 5].map((value) => ({ value, label: `${value} 分钟` }))}
                onChange={(value) => updateBrief("minutes", Number(value) as StoryMinutes)}
              />
              <SelectField
                label="叙事节奏"
                value={brief.pace}
                options={["高密推进", "层层递进", "留白呼吸"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("pace", value as StoryPace)}
              />
              <SelectField
                label="情绪底色"
                value={brief.mood}
                options={["冷峻", "温暖", "荒诞"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("mood", value as StoryMood)}
              />
              <SelectField
                label="叙事视角"
                value={brief.pov}
                options={["第一人称", "贴身第三人称", "群像视角"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("pov", value as StoryPov)}
              />
              <SelectField
                label="改编重点"
                value={brief.priority}
                options={["悬念钩子", "人物关系", "制作可行"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("priority", value as StoryPriority)}
              />
              <SelectField
                label="制作限制"
                value={brief.constraint}
                options={["单一地点", "少场景", "弹性制作"].map((value) => ({ value, label: value }))}
                onChange={(value) => updateBrief("constraint", value as StoryConstraint)}
              />
            </div>

            <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[1fr_auto]">
              <label className="block min-w-0 text-xs font-medium text-black/60">
                原文片段
                <textarea
                  aria-label="原文片段"
                  className={`${fieldClass} min-h-52 resize-y py-3 leading-7`}
                  maxLength={4800}
                  value={brief.sourceText}
                  onChange={(event) => updateBrief("sourceText", event.target.value)}
                />
                <span className="mt-2 block text-right font-mono text-[11px] text-black/35">
                  {brief.sourceText.length} / 4800
                </span>
              </label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[var(--paper-50)] p-4 text-center text-xs text-black/55 transition hover:border-[var(--persimmon-500)] lg:mt-7 lg:w-48">
                <FolderInput className="h-5 w-5 text-[var(--persimmon-600)]" aria-hidden="true" />
                <span className="mt-2 font-semibold text-[var(--ink-950)]">
                  {isReadingFile ? "正在读取" : "上传原文文件"}
                </span>
                <span className="mt-1 text-[10px]">TXT · MD · DOCX</span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".txt,.md,.docx"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void handleSourceFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-black/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-black/45">只引用当前原文，不请求外部内容。</p>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ink-950)] px-5 text-sm font-semibold text-white hover:bg-[var(--persimmon-600)] disabled:cursor-not-allowed disabled:opacity-40"
                type="submit"
                disabled={!brief.sourceText.trim()}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                生成创作路线
              </button>
            </div>
          </form>
        </div>
      </section>

      {candidates.length ? (
        <section id="candidates" className="scroll-mt-24 border-y border-black/8 bg-[#eee6d8]">
          <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--persimmon-600)]">
                  02 / Compare decisions
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">不是四个答案，是四种主动代价。</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-black/55">
                  当前任务为 {brief.genre} · {brief.audience} · {brief.minutes} 分钟；排序优先守住“{brief.priority}”，并遵守“{brief.constraint}”。
                </p>
              </div>
              {memory ? (
                <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--jade-400)]/18 px-4 text-xs font-semibold text-emerald-950">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  第 {memory.round} 轮 · 上轮反馈已计入
                </div>
              ) : null}
            </div>

            <div className="mt-7 grid min-w-0 gap-4 lg:grid-cols-2">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  scene={scenesForCandidate(candidate.id, brief.mood, 1)[0]}
                  selected={selectedId === candidate.id}
                  onSelect={() => selectCandidate(candidate.id)}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--ink-950)] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] text-white/45">当前选择</div>
                <div className="mt-1 truncate text-sm font-semibold">
                  {selectedCandidate ? `${selectedCandidate.title} · ${selectedCandidate.score} 分` : "请选择一条路线"}
                </div>
              </div>
              <button
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--persimmon-500)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={!selectedCandidate}
                onClick={confirmCandidate}
              >
                确认路线并生成交付
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {delivery ? (
        <section id="delivery" className="scroll-mt-24 bg-[var(--ink-950)] text-white">
          <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6">
            <div className="grid min-w-0 gap-6 xl:grid-cols-[1.35fr_.65fr]">
              <article className="min-w-0 rounded-[2rem] bg-[var(--paper-50)] p-4 text-[var(--ink-950)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--persimmon-600)]">
                      03 / Delivery · V{delivery.version}
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">可编辑交付稿</h2>
                    <p className="mt-2 text-sm text-black/50">{delivery.decision.title}</p>
                  </div>
                  <span className="rounded-full bg-[var(--ink-950)] px-3 py-2 font-mono text-sm text-white">
                    {delivery.decision.score}/100
                  </span>
                </div>

                <section
                  aria-label="路线分镜参照"
                  className="mt-6 rounded-2xl border border-black/10 bg-white p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--persimmon-600)]">
                        路线分镜参照
                      </div>
                      <p className="mt-1 text-xs leading-5 text-black/45">
                        由“{delivery.decision.title}”与“{delivery.brief.mood}”共同选出，可直接对照节拍写作。
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-black/35">5 SCENES</span>
                  </div>
                  <ol className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5">
                    {deliveryScenes.map((scene, index) => (
                      <li className="min-w-0 overflow-hidden rounded-xl bg-[var(--ink-950)] text-white" key={scene.id}>
                        <Image
                          alt={scene.alt}
                          className="aspect-[4/3] h-auto w-full object-cover"
                          height={800}
                          loading="lazy"
                          quality={76}
                          sizes="(max-width: 639px) 45vw, 18vw"
                          src={scene.src}
                          width={1280}
                        />
                        <div className="p-2">
                          <div className="font-mono text-[9px] text-[var(--jade-400)]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <p className="mt-1 text-[10px] leading-4 text-white/72">{scene.beat}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <label className="mt-6 block text-xs font-semibold text-black/55">
                  一句话故事
                  <textarea
                    aria-label="一句话故事"
                    className={`${fieldClass} min-h-28 resize-y py-3 text-base leading-7`}
                    value={delivery.logline}
                    onChange={(event) => updateDelivery({ ...delivery, logline: event.target.value })}
                  />
                </label>

                <ol className="mt-7 space-y-3">
                  {delivery.sections.map((section, index) => (
                    <li key={section.id} className="grid min-w-0 gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-[88px_1fr]">
                      <div>
                        <div className="font-mono text-[11px] text-[var(--persimmon-600)]">
                          {section.startSeconds}s–{section.endSeconds}s
                        </div>
                        <div className="mt-2 text-xs font-semibold">{section.name}</div>
                      </div>
                      <div className="min-w-0">
                        <textarea
                          aria-label={`${section.name}内容`}
                          className="min-h-24 w-full resize-y rounded-xl border border-black/10 bg-[var(--paper-50)] p-3 text-xs leading-6 outline-none focus:border-[var(--persimmon-500)]"
                          value={section.purpose}
                          onChange={(event) => {
                            const sections = delivery.sections.map((item, sectionIndex) =>
                              sectionIndex === index ? { ...item, purpose: event.target.value } : item,
                            );
                            updateDelivery({ ...delivery, sections });
                          }}
                        />
                        <p className="mt-2 text-[11px] leading-5 text-emerald-800">
                          原文锚点：{section.sourceAnchor}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>

              <aside className="min-w-0 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="text-[11px] font-semibold text-[var(--jade-400)]">选择理由</div>
                  <p className="mt-3 text-xs leading-7 text-white/62">{delivery.decision.reason}</p>
                </div>
                <div className="rounded-2xl border border-orange-300/15 bg-orange-400/8 p-5">
                  <div className="text-[11px] font-semibold text-orange-300">这版主动接受的代价</div>
                  <p className="mt-3 text-xs leading-7 text-white/65">{delivery.decision.tradeoff}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="text-[11px] font-semibold text-white/45">制作计划</div>
                  <p className="mt-3 text-xs leading-7 text-white/62">{delivery.productionPlan}</p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-7 text-white/62">
                    {delivery.visualDirection}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[var(--ink-950)]"
                    type="button"
                    onClick={() => downloadDelivery("markdown")}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    下载 Markdown
                  </button>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white"
                    type="button"
                    onClick={() => downloadDelivery("json")}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    下载 JSON
                  </button>
                </div>
              </aside>
            </div>

            <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--jade-400)]">
                  04 / Feedback loop
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">让一次观察，改变下一轮。</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
                  反馈不会只留在历史里。问题类型会直接改变候选权重，低分路线也会被主动降权。
                </p>
                {delivery.feedbackHistory.at(-1) ? (
                  <div className="mt-5 rounded-2xl border border-[var(--jade-400)]/20 bg-[var(--jade-400)]/8 p-4">
                    <div className="text-xs font-semibold text-[var(--jade-400)]">下一轮推荐已改变</div>
                    <p className="mt-2 text-xs leading-6 text-white/60">
                      {delivery.feedbackHistory.at(-1)?.action}
                    </p>
                  </div>
                ) : null}
              </div>

              <form
                className="min-w-0 rounded-[2rem] bg-white p-4 text-[var(--ink-950)] sm:p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitFeedback();
                }}
              >
                <fieldset>
                  <legend className="text-xs font-semibold text-black/60">这条路线现在有多成立？</legend>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <label key={score} className="relative grid min-h-11 cursor-pointer place-items-center rounded-xl border border-black/10 has-[:checked]:border-[var(--persimmon-500)] has-[:checked]:bg-orange-50">
                        <input
                          aria-label={`${score} 分`}
                          className="absolute h-px w-px opacity-0"
                          type="radio"
                          name="feedback-score"
                          value={score}
                          checked={feedbackScore === score}
                          onChange={() => setFeedbackScore(score)}
                        />
                        <span className="font-mono text-sm font-semibold">{score}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-4 block text-xs font-medium text-black/60">
                  最需要改变的地方
                  <select
                    aria-label="最需要改变的地方"
                    className={fieldClass}
                    value={feedbackIssue}
                    onChange={(event) => setFeedbackIssue(event.target.value as FeedbackIssue)}
                  >
                    {[
                      "钩子不够清楚",
                      "人物动机偏弱",
                      "节奏过满",
                      "拍摄负担偏高",
                      "可以继续",
                    ].map((issue) => (
                      <option key={issue}>{issue}</option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block text-xs font-medium text-black/60">
                  观察记录
                  <textarea
                    aria-label="观察记录"
                    className={`${fieldClass} min-h-28 resize-y py-3 leading-6`}
                    maxLength={300}
                    required
                    placeholder="例如：试读者记住了信，却没有说出人物为什么返回剧院。"
                    value={feedbackNote}
                    onChange={(event) => setFeedbackNote(event.target.value)}
                  />
                </label>

                <button
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--persimmon-500)] px-5 text-sm font-semibold text-white disabled:opacity-40"
                  type="submit"
                  disabled={!feedbackNote.trim()}
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                  保存反馈并进入下一轮
                </button>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-black/10 bg-[var(--paper-50)]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" decorative />
            <div><b className="text-sm">创剧 AI</b><p className="text-xs text-black/45">让每次改编都有依据</p></div>
          </div>
          <p className="text-xs leading-6 text-black/45">本机保存 · 随时下载 · 反馈进入下一轮</p>
          <a className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold" href="#top">
            回到开头 <ChevronRight className="h-4 w-4 -rotate-90" aria-hidden="true" />
          </a>
        </div>
      </footer>

      {candidates.length && !delivery ? (
        <div className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 rounded-2xl border border-white/10 bg-[var(--ink-950)]/96 p-3 text-white shadow-2xl backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                {selectedCandidate ? selectedCandidate.title : "选择一条路线继续"}
              </div>
              <p className="mt-1 truncate text-[10px] text-white/45">{status}</p>
            </div>
            <button
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--persimmon-500)] px-3 text-xs font-semibold disabled:opacity-40"
              type="button"
              disabled={!selectedCandidate}
              onClick={confirmCandidate}
            >
              生成交付
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">{status}</div>
    </main>
  );
}
