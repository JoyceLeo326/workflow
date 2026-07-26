import type { ProductionDocument } from "../types";

export function makeProductionDocument(): ProductionDocument {
  return {
    schemaVersion: "1",
    version: 1,
    updatedAt: "2026-07-27T00:00:00.000Z",
    storyBible: {
      title: "雨夜归途",
      logline: "林澈循着父亲留下的录音回到旧城，并在一夜之间逼近被隐瞒多年的真相。",
      genre: "悬疑短剧",
      themes: ["真相", "亲情"],
      characters: [
        {
          id: "character-lin-che",
          name: "林澈",
          role: "主角",
          goal: "查清父亲留下录音的原因",
          arc: "从逃避旧事到主动面对真相",
          relationships: "阿岚的旧友",
          sourceRef: "原著第 1 段",
        },
      ],
      locations: [
        {
          id: "location-theatre",
          name: "废弃剧院",
          description: "录音线索指向的旧城剧院",
          sourceRef: "原著第 3 段",
        },
      ],
    },
    episodes: [
      {
        id: "episode-1",
        episodeNumber: 1,
        title: "旧城录音",
        logline: "林澈回到旧城寻找父亲录音背后的秘密。",
        endingHook: "剧院深处传来母亲的名字。",
        scenes: [
          {
            id: "scene-1",
            sceneNumber: 1,
            heading: "外景 旧城街道 夜",
            summary: "林澈冒雨回到旧城。",
            action: "雨水落在空荡街道，林澈握紧录音机。",
            characters: ["林澈"],
            dialogue: "林澈：我必须知道真相。",
            sourceRef: "原著第 1 段",
            durationSeconds: 6,
          },
          {
            id: "scene-2",
            sceneNumber: 2,
            heading: "内景 废弃剧院 深夜",
            summary: "录音在剧院深处再次播放。",
            action: "舞台旧灯亮起，录音机传出一个名字。",
            characters: ["林澈", "阿岚"],
            dialogue: "阿岚：现在回头还来得及。",
            sourceRef: "原著第 3 段",
            durationSeconds: 8,
          },
        ],
      },
    ],
  };
}
