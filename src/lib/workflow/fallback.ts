import type {
  CharacterCard,
  SceneCard,
  ShotCard,
  TimelinePreview,
  WorkflowInput,
  WorkflowResults,
} from "./types";

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function excerpt(text: string, length = 72): string {
  const cleaned = cleanText(text);
  return cleaned.length > length ? `${cleaned.slice(0, length)}...` : cleaned;
}

function sentenceSeeds(text: string): string[] {
  const parts = cleanText(text)
    .split(/[。！？!?；;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 6) {
    return parts.slice(0, 6);
  }

  const fallback = [
    "主角在熟悉的世界里发现异常线索",
    "旧关系被重新点燃，隐藏冲突浮出水面",
    "主角被迫做出选择并进入未知空间",
    "关键人物说出被隐瞒的事实",
    "危机升级，主角失去退路",
    "真相揭开，主角完成转变",
  ];

  return [...parts, ...fallback].slice(0, 6);
}

function makeCharacters(title: string): CharacterCard[] {
  return [
    {
      id: "char-hero",
      name: "主角",
      role: "推动故事的核心人物",
      profile: `围绕《${title}》中的关键秘密展开行动，外表冷静但内心有强烈执念。`,
      goal: "找出事件背后的真相，并完成自我确认。",
      relationship: "与盟友互补，与阻碍者存在价值观冲突。",
      visualPrompt: "cinematic protagonist, restrained emotion, realistic portrait, soft rim light",
    },
    {
      id: "char-ally",
      name: "盟友",
      role: "提供线索和情绪支撑",
      profile: "熟悉旧事，既想保护主角，也害怕真相带来的代价。",
      goal: "让主角活着离开危险局面。",
      relationship: "与主角互相信任，但在追查尺度上产生分歧。",
      visualPrompt: "supporting character, worried eyes, urban drama, natural light",
    },
    {
      id: "char-shadow",
      name: "阻碍者",
      role: "制造压力和反转",
      profile: "掌握关键秘密，通过沉默、误导或威胁阻止主角继续追查。",
      goal: "保护被隐藏的过往，维持现有秩序。",
      relationship: "与主角形成正面对抗，也可能与旧事件有深层关联。",
      visualPrompt: "mysterious antagonist, half shadow, noir lighting, tense atmosphere",
    },
  ];
}

function makeScenes(seeds: string[]): SceneCard[] {
  return [
    {
      id: "scene-1",
      name: "开端地点",
      time: "夜晚",
      location: "旧城街道或主角回归的入口空间",
      mood: "潮湿、压抑、带有悬念",
      keyEvents: [seeds[0], seeds[1]],
      visualPrompt: "rainy old city street, reflective ground, cinematic suspense, realistic",
    },
    {
      id: "scene-2",
      name: "线索地点",
      time: "深夜",
      location: "旧屋、档案室或废弃剧院",
      mood: "紧张、探索、真相逼近",
      keyEvents: [seeds[2], seeds[3]],
      visualPrompt: "abandoned interior, flashlight beam, dust particles, film still",
    },
    {
      id: "scene-3",
      name: "决断地点",
      time: "黎明前",
      location: "高处平台、空旷舞台或城市边缘",
      mood: "对峙、释放、完成转变",
      keyEvents: [seeds[4], seeds[5]],
      visualPrompt: "wide cinematic confrontation, dawn light, emotional resolution",
    },
  ];
}

function makeShots(scenes: SceneCard[], seeds: string[]): ShotCard[] {
  const shotSizes = ["远景", "中景", "特写", "过肩镜头", "跟拍", "大全景"];
  const cameraMoves = ["缓慢推进", "固定镜头", "轻微手持", "横移", "低角度推进", "缓慢拉远"];

  return seeds.map((seed, index) => {
    const scene = scenes[Math.min(Math.floor(index / 2), scenes.length - 1)];
    const shotNumber = `S${String(index + 1).padStart(2, "0")}`;
    const durationSeconds = index % 2 === 0 ? 6 : 8;
    const visual = `${scene.name}中，${seed}`;

    return {
      id: `shot-${index + 1}`,
      shotNumber,
      sceneId: scene.id,
      scene: scene.name,
      visual,
      shotSize: shotSizes[index],
      cameraMove: cameraMoves[index],
      narration: `旁白：${seed}。`,
      subtitle: seed,
      durationSeconds,
      firstFramePrompt: `${scene.visualPrompt}, opening frame, ${visual}`,
      lastFramePrompt: `${scene.visualPrompt}, ending frame, emotional beat after ${seed}`,
    };
  });
}

function makeTimeline(shots: ShotCard[]): TimelinePreview {
  let cursor = 0;
  const items = shots.map((shot) => {
    const startSeconds = cursor;
    const endSeconds = cursor + shot.durationSeconds;
    cursor = endSeconds;

    return {
      shotNumber: shot.shotNumber,
      startSeconds,
      endSeconds,
      subtitle: shot.subtitle,
      narration: shot.narration,
      visualPrompt: shot.firstFramePrompt,
    };
  });

  return {
    totalDurationSeconds: cursor,
    items,
    narrationTrack: shots.map((shot) => shot.narration),
    subtitleTrack: shots.map((shot) => shot.subtitle),
    visualPromptTrack: shots.flatMap((shot) => [shot.firstFramePrompt, shot.lastFramePrompt]),
  };
}

export function buildFallbackWorkflowResult(input: WorkflowInput): WorkflowResults {
  const title = input.title.trim() || "未命名小说";
  const sourceSummary = excerpt(input.sourceText);
  const seeds = sentenceSeeds(input.sourceText);
  const characters = makeCharacters(title);
  const scenes = makeScenes(seeds);
  const shots = makeShots(scenes, seeds);
  const timeline = makeTimeline(shots);

  return {
    scriptStructure: {
      title,
      logline: `围绕“${sourceSummary}”改编成一支悬念驱动的短剧预演。`,
      genre: "悬疑剧情短剧",
      themes: ["真相追寻", "旧关系修复", "关键选择", "人物转变"],
      acts: [
        {
          name: "第一幕：回到事件现场",
          purpose: "建立主角目标、情绪基调和第一条线索。",
          beats: [seeds[0], seeds[1]],
        },
        {
          name: "第二幕：深入线索与关系冲突",
          purpose: "让人物关系产生压力，并把隐藏事实推到台前。",
          beats: [seeds[2], seeds[3]],
        },
        {
          name: "第三幕：对峙与转变",
          purpose: "完成真相揭示、情绪释放和成片收束。",
          beats: [seeds[4], seeds[5]],
        },
      ],
    },
    characters,
    scenes,
    shots,
    timeline,
    directorNotes: {
      summary: `已将《${title}》整理为约 ${timeline.totalDurationSeconds} 秒的短剧分镜预演。`,
      qualityChecks: [
        "已生成剧本结构、角色、场景、分镜和成片预演。",
        "每个镜头包含景别、运镜、旁白、字幕、时长和首尾帧提示词。",
        "第一版为可编辑草案，适合继续接入真实图片、配音和剪辑工具。",
      ],
      nextSteps: ["人工调整角色姓名", "补充真实场景素材", "接入图片/配音/剪辑 API"],
    },
  };
}
