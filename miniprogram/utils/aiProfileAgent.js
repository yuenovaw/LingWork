const requiredSlots = [
  { key: "name", ask: "我该怎么称呼您？比如王叔叔、李阿姨。" },
  { key: "age", ask: "您今年多大？我会帮您避开年龄不合适的工作。" },
  { key: "city", ask: "您想在哪个区附近找工作？" },
  { key: "expectedJobs", ask: "您想找哪类活？比如门卫、保洁、护工、食堂帮工。" },
  { key: "availableTime", ask: "您什么时间方便上班？上午、下午、全天，还是只做半天？" },
  { key: "phone", ask: "最后留一个手机号。不会直接公开，只有双方同意后才会给雇主看。" }
];

const nonAnswerWords = ["你好", "您好", "不知道", "不清楚", "随便", "都行", "没有", "暂时没有"];
const nanjingLocationQuestion = "目前主要支持南京地区找工。您可以说南京哪个区，或者附近地标，比如“南京鼓楼附近”“新街口附近”。";

const nanjingDistricts = [
  "玄武", "秦淮", "建邺", "鼓楼", "雨花台", "栖霞", "江宁", "浦口", "六合", "溧水", "高淳"
];

const nanjingLandmarks = [
  { word: "新街口", value: "南京新街口附近" },
  { word: "夫子庙", value: "南京秦淮区夫子庙附近" },
  { word: "南京南站", value: "南京南站附近" },
  { word: "南京站", value: "南京站附近" },
  { word: "仙林", value: "南京栖霞区仙林附近" },
  { word: "河西", value: "南京建邺区河西附近" },
  { word: "江北", value: "南京江北新区附近" },
  { word: "湖南路", value: "南京鼓楼区湖南路附近" },
  { word: "中央门", value: "南京鼓楼区中央门附近" },
  { word: "下关", value: "南京鼓楼区下关附近" }
];

const nonNanjingCities = ["北京", "上海", "广州", "深圳", "苏州", "杭州", "天津", "重庆", "成都", "武汉", "西安", "合肥"];

function isNonAnswer(text) {
  const cleaned = String(text || "").replace(/\s+/g, "");
  return nonAnswerWords.includes(cleaned);
}

function extractLocation(text, profile = {}) {
  const cleaned = String(text || "").replace(/\s+/g, "");
  const currentCity = String(profile.city || "");
  const outsideCity = nonNanjingCities.find((word) => cleaned.includes(word));
  if (outsideCity) return "";

  const mentionsNanjing = cleaned.includes("南京") || currentCity.includes("南京");
  const landmark = nanjingLandmarks.find((item) => cleaned.includes(item.word));
  if (landmark && (mentionsNanjing || landmark.word.startsWith("南京") || !currentCity)) {
    return landmark.value;
  }

  const district = nanjingDistricts.find((word) => cleaned.includes(word));
  if (district && (mentionsNanjing || currentCity.includes("南京") || !currentCity)) {
    return `南京${district}区`;
  }

  if (cleaned.includes("南京")) return "南京";

  return "";
}

function mentionsOutsideNanjing(text) {
  const cleaned = String(text || "").replace(/\s+/g, "");
  return nonNanjingCities.some((word) => cleaned.includes(word));
}

function extractProfile(text, profile) {
  const next = Object.assign({}, profile);
  const cleaned = text.replace(/\s+/g, "");
  const ageMatch = cleaned.match(/([4-7]\d)岁?/);
  const phoneMatch = cleaned.match(/1[3-9]\d{9}/);
  const jobWords = ["门卫", "保安", "保洁", "护工", "陪诊", "食堂", "帮工", "理货", "家政", "钟点工", "分拣", "快递"];
  const timeWords = ["上午", "下午", "晚上", "全天", "半天", "周末", "白天", "早上", "中午"];
  const healthWords = ["身体健康", "能久站", "不能久站", "不能搬重", "不搬重物", "腿脚", "腰", "高血压", "糖尿病", "慢性病"];

  if (!next.age && ageMatch) next.age = ageMatch[1];
  if (!next.phone && phoneMatch) next.phone = phoneMatch[0];

  if (!next.name) {
    const nameMatch = text.match(/(?:我叫|叫我|我是)([^，。,.\s]{2,6})/);
    if (nameMatch) next.name = nameMatch[1];
  }

  if (!next.expectedJobs) {
    const matchedJobs = jobWords.filter((word) => cleaned.includes(word));
    if (matchedJobs.length) next.expectedJobs = matchedJobs.join("、");
  }

  if (!next.availableTime) {
    const matchedTimes = timeWords.filter((word) => cleaned.includes(word));
    if (matchedTimes.length) next.availableTime = matchedTimes.join("、");
  }

  if (mentionsOutsideNanjing(text)) {
    next.city = "";
  } else if (!next.city || next.city === "南京") {
    const matchedLocation = extractLocation(text, next);
    if (matchedLocation) next.city = matchedLocation;
  }

  if (!next.name && cleaned.length <= 8 && !isNonAnswer(cleaned) && !ageMatch && !phoneMatch && !next.expectedJobs && !next.availableTime) {
    next.name = cleaned;
  }

  if (!next.experience && (cleaned.includes("做过") || cleaned.includes("经验") || cleaned.includes("以前") || cleaned.includes("干过"))) {
    next.experience = text;
  }

  if (!next.healthStatus) {
    const matchedHealth = healthWords.find((word) => cleaned.includes(word));
    if (matchedHealth) next.healthStatus = stripPhone(text);
  }

  return next;
}

function stripPhone(text) {
  return String(text || "")
    .replace(/1[3-9]\d{9}/g, "")
    .replace(/我的手机号是|手机号是|电话是|联系电话是/g, "")
    .replace(/[，,。；;\s]+$/g, "")
    .trim();
}

function sentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return /[。！？!?]$/.test(value) ? value : `${value}。`;
}

function getMissingSlot(profile) {
  return requiredSlots.find((slot) => !profile[slot.key]);
}

function getMissingSlots(profile) {
  return requiredSlots.filter((slot) => !profile[slot.key]);
}

function buildReply(profile) {
  const missing = getMissingSlot(profile);
  if (missing) {
    const hasAnyValue = requiredSlots.some((slot) => profile[slot.key]);
    if (missing.key === "city") {
      return {
        done: false,
        text: nanjingLocationQuestion
      };
    }
    return {
      done: false,
      text: hasAnyValue ? `好的，我记下了。${missing.ask}` : missing.ask
    };
  }

  return {
    done: true,
    text: "信息差不多齐了。我已经帮您整理成找工资料，报名时可以直接用。"
  };
}

function buildSummary(profile) {
  const name = profile.name || "求职者";
  return {
    name,
    age: Number(profile.age) || profile.age || "",
    phone: profile.phone || "",
    city: profile.city || "",
    expectedJobs: profile.expectedJobs || "",
    availableTime: profile.availableTime || "",
    experience: profile.experience || "愿意学习，能认真完成工作。",
    healthStatus: profile.healthStatus || "",
    resumeText: `${name}，${profile.age || ""}岁，想在${profile.city || "附近"}找${profile.expectedJobs || "合适的工作"}，${profile.availableTime || "时间可沟通"}。${sentence(profile.experience || "愿意学习，能认真完成工作。")}${profile.healthStatus ? `身体情况：${sentence(profile.healthStatus)}` : ""}`
  };
}

module.exports = {
  requiredSlots,
  extractProfile,
  getMissingSlots,
  buildReply,
  buildSummary
};
