"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  visualStoryV3,
  visualStoryV3Phases,
  type VisualStoryStage,
} from "@/lib/story-studio/visual-story-v3";

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
type StoryFilter = "core" | VisualStoryStage;

export function VisualStoryV3({ activeStage }: { activeStage: VisualStoryStage }) {
  const [filter, setFilter] = useState<StoryFilter>(activeStage === "intake" ? "core" : activeStage);
  const [expanded, setExpanded] = useState(false);

  const visibleStories = useMemo(() => {
    if (filter !== "core") return visualStoryV3.filter((story) => story.phase === filter);
    return expanded ? visualStoryV3 : visualStoryV3.filter((story) => story.coreReachable);
  }, [expanded, filter]);

  function chooseFilter(nextFilter: StoryFilter) {
    setFilter(nextFilter);
    setExpanded(false);
  }

  return (
    <section
      aria-labelledby="visual-story-v3-title"
      className="border-y border-white/8 bg-[var(--ink-950)] text-white"
      data-testid="visual-story-v3"
      id="visual-story-v3"
    >
      <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:py-16">
        <header className="grid min-w-0 gap-5 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[var(--jade-400)]">
              50 STORY DECISIONS · ONE TRACEABLE JOURNEY
            </p>
            <h2
              className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl lg:text-6xl"
              id="visual-story-v3-title"
            >
              把改编决定，放回它发生的现场。
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/58">
            默认先看主流程可直接到达的 20 幕。也可以按任务、取证、取舍、交付与改版查看完整 50 幕；每一幕都说明谁在什么情境下做了什么，产品状态因此怎样改变。
          </p>
        </header>

        <nav
          aria-label="按故事工作阶段查看场景"
          className="mt-7 flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
        >
          <button
            aria-pressed={filter === "core"}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
              filter === "core"
                ? "border-[var(--jade-400)] bg-[var(--jade-400)] text-[var(--ink-950)]"
                : "border-white/12 bg-white/5 text-white/72 hover:border-white/35"
            }`}
            type="button"
            onClick={() => chooseFilter("core")}
          >
            核心 20 幕
          </button>
          {visualStoryV3Phases.map((phase) => (
            <button
              aria-pressed={filter === phase.id}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
                filter === phase.id
                  ? "border-[var(--jade-400)] bg-[var(--jade-400)] text-[var(--ink-950)]"
                  : "border-white/12 bg-white/5 text-white/72 hover:border-white/35"
              }`}
              key={phase.id}
              type="button"
              onClick={() => chooseFilter(phase.id)}
            >
              {phase.label}
            </button>
          ))}
        </nav>

        <p className="mt-2 min-h-6 text-[11px] leading-6 text-white/45" role="status">
          当前展示 {visibleStories.length} 幕
          {filter === "core" ? ` / ${expanded ? 50 : 20}` : ""} · 当前旅程阶段：
          {visualStoryV3Phases.find((phase) => phase.id === activeStage)?.label}
        </p>

        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2" data-testid="visual-story-v3-grid">
          {visibleStories.map((story) => (
            <article
              className="grid min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] [contain-intrinsic-size:340px] [content-visibility:auto] sm:grid-cols-[minmax(190px,.8fr)_minmax(0,1.2fr)]"
              data-core-reachable={String(story.coreReachable)}
              key={story.id}
            >
              <figure className="relative m-0 aspect-[3/2] min-w-0 overflow-hidden bg-black sm:aspect-auto sm:min-h-60">
                <Image
                  alt={story.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  height={512}
                  loading="lazy"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 42vw, 24vw"
                  src={`${ASSET_BASE}${story.src}`}
                  width={768}
                />
                <span className="absolute top-3 left-3 grid min-h-9 min-w-9 place-items-center rounded-full bg-[var(--jade-400)] px-2 font-mono text-[10px] font-bold text-[var(--ink-950)]">
                  {String(visualStoryV3.indexOf(story) + 1).padStart(2, "0")}
                </span>
              </figure>
              <div className="min-w-0 p-4 sm:p-5">
                <div className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--jade-400)]">
                  {story.phaseLabel} · {story.person}
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-6 tracking-tight text-white">
                  {story.productState}
                </h3>
                <p className="mt-2 text-xs leading-6 text-white/58">{story.outcome}</p>
                <dl className="mt-4 grid gap-2 border-t border-white/8 pt-4 text-[11px] leading-5">
                  <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2">
                    <dt className="font-semibold text-[var(--persimmon-500)]">情境</dt>
                    <dd className="m-0 min-w-0 text-white/42">{story.situation}</dd>
                  </div>
                  <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2">
                    <dt className="font-semibold text-[var(--persimmon-500)]">动作</dt>
                    <dd className="m-0 min-w-0 text-white/42">{story.action}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>

        {filter === "core" ? (
          <button
            aria-expanded={expanded}
            className="mx-auto mt-6 flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-semibold text-white hover:border-[var(--jade-400)]"
            type="button"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "收起到核心 20 幕" : "查看完整 50 幕"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
