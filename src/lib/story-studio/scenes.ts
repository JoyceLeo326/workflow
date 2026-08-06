import type { StoryGenre, StoryMood } from "@/lib/story-studio/engine";

export type CandidateRouteId =
  | "hook-first"
  | "relationship-echo"
  | "single-location"
  | "ensemble-crosscut";

export type StoryScene = {
  id: string;
  title: string;
  alt: string;
  src: string;
  beat: string;
  genres: readonly StoryGenre[];
  moods: readonly StoryMood[];
  routeIds: readonly CandidateRouteId[];
};

export const storyScenes: readonly StoryScene[] = [
  {
    id: "rain-theatre-letter",
    title: "雨夜剧院的信",
    alt: "雨夜旧剧院后台，年轻人拆开密封信，另一人停在门口",
    src: "/story-scenes/rain-theatre-letter.webp",
    beat: "证据第一次出现",
    genres: ["悬疑", "都市情感"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "single-location"],
  },
  {
    id: "recorder-on-stage",
    title: "舞台上的录音机",
    alt: "空剧场中央的旧录音机亮起红灯，年轻人从暗处靠近",
    src: "/story-scenes/recorder-on-stage.webp",
    beat: "物件先于人物发声",
    genres: ["悬疑"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "single-location"],
  },
  {
    id: "last-subway-reflection",
    title: "末班地铁倒影",
    alt: "深夜末班地铁里，围橙色围巾的乘客凝视雨窗中的倒影",
    src: "/story-scenes/last-subway-reflection.webp",
    beat: "熟悉空间发生微小失衡",
    genres: ["悬疑", "都市情感"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "relationship-echo"],
  },
  {
    id: "rooftop-sibling-key",
    title: "天台归还旧钥匙",
    alt: "晨光天台上，久未和解的兄妹隔着距离交还一把旧钥匙",
    src: "/story-scenes/rooftop-sibling-key.webp",
    beat: "关系用动作而非解释松动",
    genres: ["都市情感"],
    moods: ["温暖", "冷峻"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "kitchen-repaired-bowl",
    title: "厨房里的补碗",
    alt: "蒸汽弥漫的家中厨房，女儿把修好的陶碗推向母亲",
    src: "/story-scenes/kitchen-repaired-bowl.webp",
    beat: "旧裂痕获得可见回应",
    genres: ["都市情感"],
    moods: ["温暖"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "alley-noodle-shop",
    title: "面馆打烊重逢",
    alt: "雨后巷口面馆正在落闸，老师傅与旧徒弟意外重逢",
    src: "/story-scenes/alley-noodle-shop.webp",
    beat: "关闭动作被共同托住",
    genres: ["都市情感", "轻喜"],
    moods: ["温暖", "荒诞"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "lakeside-missing-boat",
    title: "湖边消失的船",
    alt: "清晨雾湖码头，三名亲属看着空泊位和落入水中的绳索",
    src: "/story-scenes/lakeside-missing-boat.webp",
    beat: "缺席成为共同问题",
    genres: ["悬疑"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "ensemble-crosscut"],
  },
  {
    id: "ancestral-house-footprints",
    title: "老宅泥脚印",
    alt: "午后老宅长廊里，年轻女人追随泥脚印，长辈在暗处注视",
    src: "/story-scenes/ancestral-house-footprints.webp",
    beat: "空间痕迹指向家族秘密",
    genres: ["悬疑", "都市情感"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "ensemble-crosscut"],
  },
  {
    id: "school-radio-room",
    title: "黄昏广播室",
    alt: "空校广播室里麦克风意外接通，学生与门外同学隔窗对望",
    src: "/story-scenes/school-radio-room.webp",
    beat: "秘密被迫进入公共频道",
    genres: ["悬疑", "轻喜"],
    moods: ["冷峻", "荒诞"],
    routeIds: ["hook-first", "single-location"],
  },
  {
    id: "snowfield-red-scarf",
    title: "雪地红围巾",
    alt: "雪地公交站旁，孩子追随树枝上的红围巾，祖父从远处赶来",
    src: "/story-scenes/snowfield-red-scarf.webp",
    beat: "清晰色点牵引行动",
    genres: ["都市情感"],
    moods: ["温暖", "冷峻"],
    routeIds: ["hook-first", "relationship-echo"],
  },
  {
    id: "seaside-bus-terminal",
    title: "海边末班车",
    alt: "蓝调时刻的海边车站，提箱女儿隔着湿地面看见母亲等待",
    src: "/story-scenes/seaside-bus-terminal.webp",
    beat: "离开与留下同时可见",
    genres: ["都市情感"],
    moods: ["温暖", "冷峻"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "neon-laundromat-photo",
    title: "洗衣店遗落照片",
    alt: "深夜自助洗衣店里，两名陌生人同时伸手拿起遗落照片",
    src: "/story-scenes/neon-laundromat-photo.webp",
    beat: "偶然接触制造新关系",
    genres: ["轻喜", "都市情感"],
    moods: ["荒诞", "温暖"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "mountain-clinic-night",
    title: "山中诊所停电夜",
    alt: "暴雨夜的山中诊所，医生用手电接过送药人带来的药箱",
    src: "/story-scenes/mountain-clinic-night.webp",
    beat: "多方接力解决眼前难题",
    genres: ["都市情感", "悬疑"],
    moods: ["温暖", "冷峻"],
    routeIds: ["ensemble-crosscut", "single-location"],
  },
  {
    id: "community-dance-hall",
    title: "社区舞厅再入场",
    alt: "社区舞厅排练暂停，老人拿着旧舞鞋走向等待的伙伴们",
    src: "/story-scenes/community-dance-hall.webp",
    beat: "个人迟疑被集体接住",
    genres: ["都市情感", "轻喜"],
    moods: ["温暖", "荒诞"],
    routeIds: ["ensemble-crosscut", "relationship-echo"],
  },
  {
    id: "elevator-power-outage",
    title: "电梯停电生日",
    alt: "停电电梯里，四名邻居举起手机灯，孩子捧着生日蛋糕",
    src: "/story-scenes/elevator-power-outage.webp",
    beat: "封闭空间迫使陌生人协作",
    genres: ["轻喜", "都市情感"],
    moods: ["荒诞", "温暖"],
    routeIds: ["ensemble-crosscut", "single-location"],
  },
  {
    id: "summer-market-reunion",
    title: "夏日市场寻人",
    alt: "雨后夏日市场里，摊主们协力照看孩子，家长从远处跑来",
    src: "/story-scenes/summer-market-reunion.webp",
    beat: "多个动作在同一目标汇合",
    genres: ["轻喜", "都市情感"],
    moods: ["温暖", "荒诞"],
    routeIds: ["ensemble-crosscut", "hook-first"],
  },
  {
    id: "archive-secret-drawer",
    title: "档案馆暗格",
    alt: "闭馆后的档案室里，研究者拉开暗格，管理员在门边转动钥匙",
    src: "/story-scenes/archive-secret-drawer.webp",
    beat: "隐藏信息与知情者同场出现",
    genres: ["悬疑"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "single-location"],
  },
  {
    id: "pottery-broken-cup",
    title: "陶室碎杯",
    alt: "争执后的陶艺室里，两名前搭档从碎杯两侧伸手捡起碎片",
    src: "/story-scenes/pottery-broken-cup.webp",
    beat: "破裂关系获得具象道具",
    genres: ["都市情感"],
    moods: ["冷峻", "温暖"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "fog-ferry-umbrella",
    title: "雾中渡轮雨伞",
    alt: "浓雾渡轮甲板上，女人发现无人照看的绿伞与温热纸杯",
    src: "/story-scenes/fog-ferry-umbrella.webp",
    beat: "反常遗留物触发搜索",
    genres: ["悬疑"],
    moods: ["冷峻"],
    routeIds: ["hook-first", "ensemble-crosscut"],
  },
  {
    id: "village-cinema-projector",
    title: "乡村影院最后一场",
    alt: "旧影院放映室里，老放映员与三名少年共同穿引胶片",
    src: "/story-scenes/village-cinema-projector.webp",
    beat: "旧手艺被下一代接续",
    genres: ["都市情感", "轻喜"],
    moods: ["温暖"],
    routeIds: ["ensemble-crosscut", "relationship-echo"],
  },
  {
    id: "hospital-stairwell-voicemail",
    title: "医院楼梯留言",
    alt: "清晨医院楼梯间，护士听手机留言，父亲提着早餐站在上层",
    src: "/story-scenes/hospital-stairwell-voicemail.webp",
    beat: "关心先以声音抵达",
    genres: ["都市情感"],
    moods: ["温暖", "冷峻"],
    routeIds: ["relationship-echo", "single-location"],
  },
  {
    id: "balcony-herb-rain",
    title: "雨中阳台香草",
    alt: "夏雨阳台上，两位邻居隔墙看着被悄悄救活的盆栽香草",
    src: "/story-scenes/balcony-herb-rain.webp",
    beat: "日常照料显露隐性关系",
    genres: ["都市情感", "轻喜"],
    moods: ["温暖"],
    routeIds: ["relationship-echo", "ensemble-crosscut"],
  },
  {
    id: "train-dining-car-locket",
    title: "列车餐车归还项链",
    alt: "暮色列车餐车里，陌生人隔桌归还一枚遗失的旧项链",
    src: "/story-scenes/train-dining-car-locket.webp",
    beat: "归还动作建立脆弱信任",
    genres: ["悬疑", "都市情感"],
    moods: ["冷峻", "温暖"],
    routeIds: ["hook-first", "relationship-echo"],
  },
  {
    id: "temple-fair-music-box",
    title: "灯会音乐盒",
    alt: "夜间灯会中，多名年轻人围拢在展示木制音乐盒的老人身边",
    src: "/story-scenes/temple-fair-music-box.webp",
    beat: "分散线索在群体中合拢",
    genres: ["轻喜", "悬疑"],
    moods: ["荒诞", "温暖"],
    routeIds: ["ensemble-crosscut", "hook-first"],
  },
];

function stableSceneScore(seed: string) {
  return Array.from(seed).reduce((score, character) => (score * 31 + character.charCodeAt(0)) % 997, 17);
}

export function scenesForCandidate(candidateId: string, mood: StoryMood, count = 5) {
  const routeId = candidateId as CandidateRouteId;
  const routeScenes = storyScenes.filter((scene) => scene.routeIds.includes(routeId));
  const pool = routeScenes.length ? routeScenes : storyScenes;

  return [...pool]
    .sort((left, right) => {
      const moodDelta = Number(right.moods.includes(mood)) - Number(left.moods.includes(mood));
      if (moodDelta) return moodDelta;
      return (
        stableSceneScore(`${candidateId}:${mood}:${left.id}`) -
        stableSceneScore(`${candidateId}:${mood}:${right.id}`)
      );
    })
    .slice(0, Math.max(0, Math.min(count, pool.length)));
}
