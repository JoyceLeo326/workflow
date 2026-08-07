export const STORY_SCENES = [
  ["rain-theatre-letter", "雨夜剧院的信", "证据第一次出现", ["suspense-hook", "single-stage"]],
  ["recorder-on-stage", "舞台上的录音机", "物件先于人物发声", ["suspense-hook", "single-stage"]],
  ["last-subway-reflection", "末班地铁倒影", "熟悉空间发生微小失衡", ["suspense-hook", "emotion-echo"]],
  ["rooftop-sibling-key", "天台归还旧钥匙", "关系用动作而非解释松动", ["emotion-echo", "single-stage"]],
  ["kitchen-repaired-bowl", "厨房里的补碗", "旧裂痕获得可见回应", ["emotion-echo", "single-stage"]],
  ["alley-noodle-shop", "面馆打烊重逢", "关闭动作被共同托住", ["emotion-echo", "single-stage"]],
  ["lakeside-missing-boat", "湖边消失的船", "缺席成为共同问题", ["suspense-hook", "ensemble"]],
  ["ancestral-house-footprints", "老宅泥脚印", "空间痕迹指向家族秘密", ["suspense-hook", "ensemble"]],
  ["school-radio-room", "黄昏广播室", "秘密被迫进入公共频道", ["suspense-hook", "single-stage"]],
  ["snowfield-red-scarf", "雪地红围巾", "清晰色点牵引行动", ["suspense-hook", "emotion-echo"]],
  ["seaside-bus-terminal", "海边末班车", "离开与留下同时可见", ["emotion-echo", "single-stage"]],
  ["neon-laundromat-photo", "洗衣店遗落照片", "偶然接触制造新关系", ["emotion-echo", "single-stage"]],
  ["mountain-clinic-night", "山中诊所停电夜", "多方接力解决眼前难题", ["ensemble", "single-stage"]],
  ["community-dance-hall", "社区舞厅再入场", "个人迟疑被集体接住", ["ensemble", "emotion-echo"]],
  ["elevator-power-outage", "电梯停电生日", "封闭空间迫使陌生人协作", ["ensemble", "single-stage"]],
  ["summer-market-reunion", "夏日市场寻人", "多个动作在同一目标汇合", ["ensemble", "suspense-hook"]],
  ["archive-secret-drawer", "档案馆暗格", "隐藏信息与知情者同场出现", ["suspense-hook", "single-stage"]],
  ["pottery-broken-cup", "陶室碎杯", "破裂关系获得具象道具", ["emotion-echo", "single-stage"]],
  ["fog-ferry-umbrella", "雾中渡轮雨伞", "反常遗留物触发搜索", ["suspense-hook", "ensemble"]],
  ["village-cinema-projector", "乡村影院最后一场", "旧手艺被下一代接续", ["ensemble", "emotion-echo"]],
  ["hospital-stairwell-voicemail", "医院楼梯留言", "关心先以声音抵达", ["emotion-echo", "single-stage"]],
  ["balcony-herb-rain", "雨中阳台香草", "日常照料显露隐性关系", ["emotion-echo", "ensemble"]],
  ["train-dining-car-locket", "列车餐车归还项链", "归还动作建立脆弱信任", ["suspense-hook", "emotion-echo"]],
  ["temple-fair-music-box", "灯会音乐盒", "分散线索在群体中合拢", ["ensemble", "suspense-hook"]],
].map(([id, title, beat, routes], index) => ({
  id,
  title,
  beat,
  routes,
  src: `./story-scenes/${id}.webp`,
  alt: `${title}：${beat}的电影感故事场景`,
  number: String(index + 1).padStart(2, "0"),
}));

export function scenesForCandidate(candidateId, count = 5) {
  const matched = STORY_SCENES.filter((scene) => scene.routes.includes(candidateId));
  return (matched.length ? matched : STORY_SCENES).slice(0, count);
}
