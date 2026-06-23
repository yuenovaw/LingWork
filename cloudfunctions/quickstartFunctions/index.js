const cloud = require("wx-server-sdk");
const https = require("https");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

const requiredProfileFields = [{
    key: "name",
    label: "称呼"
  },
  {
    key: "age",
    label: "年龄"
  },
  {
    key: "city",
    label: "找工地区"
  },
  {
    key: "expectedJobs",
    label: "想找的工作"
  },
  {
    key: "availableTime",
    label: "可上班时间"
  },
  {
    key: "phone",
    label: "手机号"
  },
];

const defaultQuestions = {
  name: "我该怎么称呼您？比如王叔叔、李阿姨。",
  age: "您今年多大？我会帮您避开年龄不合适的工作。",
  city: "您想在哪个区附近找工作？",
  expectedJobs: "您想找哪类活？比如门卫、保洁、护工、食堂帮工。",
  availableTime: "您什么时间方便上班？上午、下午、全天，还是只做半天？",
  experience: "您以前做过什么相关工作？没有也没关系，我会如实整理。",
  healthStatus: "身体情况方便说一下吗？比如能不能久站、能不能搬重物。",
  phone: "最后留一个手机号。不会直接公开，只有双方同意后才会给雇主看。",
};

const nanjingLocationQuestion = "目前主要支持南京地区找工。您可以说南京哪个区，或者附近地标，比如“南京鼓楼附近”“新街口附近”。";

const nonAnswerWords = ["你好", "您好", "不知道", "不清楚", "随便", "都行", "没有", "暂时没有"];

const nanjingDistricts = [
  "玄武", "秦淮", "建邺", "鼓楼", "雨花台", "栖霞", "江宁", "浦口", "六合", "溧水", "高淳"
];

const nanjingLandmarks = [{
    word: "新街口",
    value: "南京新街口附近"
  },
  {
    word: "夫子庙",
    value: "南京秦淮区夫子庙附近"
  },
  {
    word: "南京南站",
    value: "南京南站附近"
  },
  {
    word: "南京站",
    value: "南京站附近"
  },
  {
    word: "仙林",
    value: "南京栖霞区仙林附近"
  },
  {
    word: "河西",
    value: "南京建邺区河西附近"
  },
  {
    word: "江北",
    value: "南京江北新区附近"
  },
  {
    word: "湖南路",
    value: "南京鼓楼区湖南路附近"
  },
  {
    word: "中央门",
    value: "南京鼓楼区中央门附近"
  },
  {
    word: "下关",
    value: "南京鼓楼区下关附近"
  }
];

const nonNanjingCities = ["北京", "上海", "广州", "深圳", "苏州", "杭州", "天津", "重庆", "成都", "武汉", "西安", "合肥"];

function isNonAnswer(text) {
  const cleaned = String(text || "").replace(/\s+/g, "");
  return nonAnswerWords.includes(cleaned);
}

function extractLocationFallback(text, profile = {}) {
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

function isOutsideNanjingLocation(location) {
  const cleaned = String(location || "").replace(/\s+/g, "");
  if (!cleaned) return false;
  return nonNanjingCities.some((word) => cleaned.includes(word));
}

const AI_PROFILE_SYSTEM_PROMPT = [
  "你是“找龄工”微信小程序里的 AI 简历登记助手，服务对象主要是 50 岁以上、可能不熟悉手机和简历写作的求职者。",
  "",
  "你的任务：通过自然聊天，帮用户生成一份给雇主看的零工求职资料。你要像耐心的人类登记员，不要像表单。",
  "",
  "必须收集的核心字段：",
  "1. name：称呼，例如王叔叔、李阿姨。用户只说“你好”“不知道”不能当作称呼。",
  "2. age：年龄，只需要年龄数字。",
  "3. city：找工地区，可以是城市、区县、街道、附近地标；用户不知道区县时，引导他说城市或附近地标，不要重复原问题。",
  "4. expectedJobs：想找的工作，例如门卫、保洁、护工、食堂帮工、理货、家政等。",
  "5. availableTime：可上班时间，例如上午、下午、全天、周末、白天、半天。",
  "6. phone：手机号。提醒用户手机号不会直接公开，只有双方同意后才展示。",
  "",
  "可选字段：experience、healthStatus。用户主动说了就整理；没有说不要反复追问，不要因为缺这两项阻止生成简历。",
  "",
  "对话规则：",
  "- 每次回复最多 1 到 2 句话，只追问一个最关键缺失信息。",
  "- 语气温和、清楚、适老化，避免长句和术语。",
  "- 不要索要身份证、完整家庭住址、银行卡、学历证明等不必要敏感信息。",
  "- 如果用户回答“不知道”“不清楚”，不要原样重复上一题，要换一种更容易回答的问法。",
  "- 如果用户一次说了多项信息，要一次性提取，不要再重复问已经说过的内容。",
  "- 不要编造用户没说过的信息。地区不清楚时继续引导，不要默认北京。",
  "- 当前小程序主要服务南京用户。南京市辖区包括玄武、秦淮、建邺、鼓楼、雨花台、栖霞、江宁、浦口、六合、溧水、高淳。",
  "- 必须判断用户说的地区是否在南京服务范围内。用户说北京、上海、广州、深圳、苏州、杭州等非南京城市时，不要把这些城市填入 city。",
  "- 如果缺少 city，回复必须只举南京例子，例如“南京鼓楼附近”“新街口附近”，禁止举北京、上海、广州、深圳等外地例子。",
  "- 如果用户明确说不在南京，例如“我在北京”，要温和说明目前主要支持南京地区找工，并请他说南京哪个区/地标；不要继续询问北京具体区域。",
  "- 用户说“南京鼓楼”“鼓楼附近”，在南京语境下应理解为南京鼓楼区；不要改成北京鼓楼或北京朝阳。",
  "- 用户说“新街口”“夫子庙”“南京南站”“仙林”“河西”“湖南路”“中央门”“下关”等南京地标时，整理为南京相关地区。",
  "",
  "输出要求：必须只返回 JSON 对象，不要 Markdown，不要解释。",
  "JSON 字段：",
  "{",
  "  \"profile\": {\"name\":\"\",\"age\":\"\",\"city\":\"\",\"expectedJobs\":\"\",\"availableTime\":\"\",\"experience\":\"\",\"healthStatus\":\"\",\"phone\":\"\"},",
  "  \"reply\": \"下一句对用户说的话\",",
  "  \"done\": false,",
  "  \"summary\": null",
  "}",
  "done 为 true 时，summary 必须是完整简历对象，包含 name、age、phone、city、expectedJobs、availableTime、experience、healthStatus、resumeText。"
].join("\n");

function extractProfileFallback(text, profile = {}) {
  const next = Object.assign({}, profile);
  const cleaned = String(text || "").replace(/\s+/g, "");
  const ageMatch = cleaned.match(/([4-7]\d)岁?/);
  const phoneMatch = cleaned.match(/1[3-9]\d{9}/);
  const jobWords = ["门卫", "保安", "保洁", "护工", "陪诊", "食堂", "帮工", "理货", "家政", "钟点工", "分拣", "快递"];
  const timeWords = ["上午", "下午", "晚上", "全天", "半天", "周末", "白天", "早上", "中午"];
  const healthWords = ["身体健康", "能久站", "不能久站", "不能搬重", "不搬重物", "腿脚", "腰", "高血压", "糖尿病", "慢性病"];

  if (!next.name) {
    const nameMatch = String(text || "").match(/(?:我叫|叫我|我是)([^，。,.\s]{2,6})/);
    if (nameMatch && !isNonAnswer(nameMatch[1])) next.name = nameMatch[1];
  }
  if (!next.age && ageMatch) next.age = ageMatch[1];
  if (!next.phone && phoneMatch) next.phone = phoneMatch[0];
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
    const matchedCity = extractLocationFallback(text, next);
    if (matchedCity) next.city = matchedCity;
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

function buildSummary(profile = {}) {
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
    resumeText: `${name}，${profile.age || ""}岁，想在${profile.city || "附近"}找${profile.expectedJobs || "合适的工作"}，${profile.availableTime || "时间可沟通"}。${sentence(profile.experience || "愿意学习，能认真完成工作。")}${profile.healthStatus ? `身体情况：${sentence(profile.healthStatus)}` : ""}`,
  };
}

function getMissingFields(profile = {}) {
  return requiredProfileFields.filter((field) => !profile[field.key]).map((field) => field.key);
}

function parseJsonObject(text) {
  if (!text) throw new Error("empty model response");
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw e;
    return JSON.parse(match[0]);
  }
}

function requestDeepSeek(payload) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("DEEPSEEK_API_KEY is not configured"));
  }

  const body = JSON.stringify(payload);
  const options = {
    hostname: "api.deepseek.com",
    path: "/chat/completions",
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    timeout: 15000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`DeepSeek HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("DeepSeek request timeout"));
    });
    req.write(body);
    req.end();
  });
}

function sha256(message, encoding) {
  return crypto.createHash("sha256").update(message).digest(encoding);
}

function hmacSha256(key, message, encoding) {
  return crypto.createHmac("sha256", key).update(message).digest(encoding);
}

function requestTencentCloud(action, payload, config = {}) {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) {
    return Promise.reject(new Error("TENCENT_SECRET_ID or TENCENT_SECRET_KEY is not configured"));
  }

  const service = config.service || "asr";
  const host = config.host || "asr.tencentcloudapi.com";
  const region = config.region || process.env.TENCENT_REGION || "ap-shanghai";
  const version = config.version || "2019-06-14";
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const body = JSON.stringify(payload);

  const canonicalRequest = [
    "POST",
    "/",
    "",
    `content-type:application/json; charset=utf-8\nhost:${host}\n`,
    "content-type;host",
    sha256(body, "hex"),
  ].join("\n");

  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(timestamp),
    credentialScope,
    sha256(canonicalRequest, "hex"),
  ].join("\n");

  const secretDate = hmacSha256(`TC3${secretKey}`, date);
  const secretService = hmacSha256(secretDate, service);
  const secretSigning = hmacSha256(secretService, "tc3_request");
  const signature = hmacSha256(secretSigning, stringToSign, "hex");
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

  const options = {
    hostname: host,
    path: "/",
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      Host: host,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Timestamp": String(timestamp),
      "X-TC-Region": region,
    },
    timeout: 20000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          reject(e);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || parsed.Response.Error) {
          const message = parsed.Response && parsed.Response.Error ?
            `${parsed.Response.Error.Code}: ${parsed.Response.Error.Message}` :
            `TencentCloud HTTP ${res.statusCode}`;
          reject(new Error(message));
          return;
        }
        resolve(parsed.Response);
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("Tencent ASR request timeout"));
    });
    req.write(body);
    req.end();
  });
}

const recognizeSpeech = async (event) => {
  if (!event.fileID) {
    return {
      success: false,
      errorMessage: "fileID is required",
    };
  }

  let audioBytes = 0;
  try {
    const downloaded = await cloud.downloadFile({
      fileID: event.fileID,
    });
    const buffer = downloaded.fileContent;
    audioBytes = buffer ? buffer.length : 0;
    if (!buffer || !buffer.length) {
      throw new Error("empty audio file");
    }
    if (buffer.length > 3 * 1024 * 1024) {
      throw new Error("audio file exceeds 3MB");
    }

    const voiceFormat = event.voiceFormat || "aac";
    const response = await requestTencentCloud("SentenceRecognition", {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: event.engServiceType || process.env.TENCENT_ASR_ENGINE || "16k_zh_dialect",
      SourceType: 1,
      VoiceFormat: voiceFormat,
      Data: buffer.toString("base64"),
      DataLen: buffer.length,
      FilterDirty: 0,
      FilterModal: 1,
      FilterPunc: 0,
      ConvertNumMode: 1,
      HotwordList: "找龄工|11,南京|11,南京鼓楼|11,鼓楼区|10,新街口|10,夫子庙|10,南京南站|10,仙林|9,河西|9,门卫|10,保洁|10,护工|10,食堂帮工|10,陪诊|10,手机号|10",
    });

    return {
      success: true,
      text: response.Result || "",
      duration: response.AudioDuration || 0,
      requestId: response.RequestId,
    };
  } catch (e) {
    return {
      success: false,
      errorMessage: e.message,
      audioBytes,
    };
  } finally {
    try {
      await cloud.deleteFile({
        fileList: [event.fileID],
      });
    } catch (e) {
      // Temporary voice cleanup failure should not block speech recognition.
    }
  }
};

const synthesizeSpeech = async (event) => {
  const text = String(event.text || "").replace(/\s+/g, " ").trim().slice(0, 150);
  if (!text) {
    return {
      success: false,
      errorMessage: "text is required",
    };
  }

  try {
    const response = await requestTencentCloud("TextToVoice", {
      Text: text,
      SessionId: `tts-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      Volume: Number(process.env.TENCENT_TTS_VOLUME || 2),
      Speed: Number(process.env.TENCENT_TTS_SPEED || -0.2),
      ProjectId: 0,
      ModelType: 1,
      VoiceType: Number(process.env.TENCENT_TTS_VOICE_TYPE || 1001),
      PrimaryLanguage: 1,
      SampleRate: 16000,
      Codec: "mp3",
    }, {
      service: "tts",
      host: "tts.tencentcloudapi.com",
      version: "2019-08-23",
      region: process.env.TENCENT_TTS_REGION || process.env.TENCENT_REGION || "ap-shanghai",
    });

    if (!response.Audio) {
      throw new Error("empty TTS audio");
    }

    const upload = await cloud.uploadFile({
      cloudPath: `tts-profiles/${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`,
      fileContent: Buffer.from(response.Audio, "base64"),
    });
    const temp = await cloud.getTempFileURL({
      fileList: [upload.fileID],
    });
    const file = temp.fileList && temp.fileList[0];

    return {
      success: true,
      audioFileID: upload.fileID,
      tempFileURL: file && file.tempFileURL,
      requestId: response.RequestId,
    };
  } catch (e) {
    return {
      success: false,
      errorMessage: e.message,
    };
  }
};

const aiProfileChat = async (event) => {
  const userText = String(event.text || "").slice(0, 500);
  const currentProfile = event.profile && typeof event.profile === "object" ? event.profile : {};
  const history = Array.isArray(event.messages) ?
    event.messages.slice(-10).map((item) => ({
      role: item.role === "user" ? "user" : "assistant",
      content: String(item.text || "").slice(0, 300),
    })).filter((item) => item.content) : [];
  const fallbackProfile = extractProfileFallback(userText, currentProfile);
  const fallbackMissing = getMissingFields(fallbackProfile);

  const userPrompt = JSON.stringify({
    currentProfile,
    latestUserText: userText,
    recentConversation: history,
    fallbackExtractedProfile: fallbackProfile,
    missingFields: fallbackMissing,
    outputSchema: {
      profile: {
        name: "string",
        age: "number or string",
        city: "string",
        expectedJobs: "string",
        availableTime: "string",
        experience: "string optional",
        healthStatus: "string optional",
        phone: "string",
      },
      reply: "下一句对用户说的话",
      done: "boolean",
      summary: "done 为 true 时返回完整简历对象，否则 null",
    },
  });

  try {
    const completion = await requestDeepSeek({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [{
          role: "system",
          content: AI_PROFILE_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userPrompt
        },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
    });

    const content = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;
    const parsed = parseJsonObject(content);
    const profile = Object.assign({}, fallbackProfile, parsed.profile || {});
    if (mentionsOutsideNanjing(userText) || isOutsideNanjingLocation(profile.city)) {
      profile.city = "";
    }
    const missing = getMissingFields(profile);
    const done = missing.length === 0;
    const reply = done ?
      "信息已经齐了。我帮您整理成找工资料，报名时可以直接用。" :
      (missing[0] === "city" ? nanjingLocationQuestion : (parsed.reply || defaultQuestions[missing[0]]));

    return {
      success: true,
      source: "deepseek",
      profile,
      missingFields: missing,
      reply,
      done,
      summary: done ? (parsed.summary || buildSummary(profile)) : null,
    };
  } catch (e) {
    const missing = getMissingFields(fallbackProfile);
    const question = missing[0] === "city" ?
      nanjingLocationQuestion :
      defaultQuestions[missing[0]];
    const hasAnyValue = requiredProfileFields.some((field) => fallbackProfile[field.key]);
    const reply = missing.length ?
      (question.startsWith("没关系") || !hasAnyValue ? question : `好的，我记下了。${question}`) :
      "信息已经齐了。我帮您整理成找工资料，报名时可以直接用。";
    return {
      success: false,
      fallback: true,
      source: "fallback",
      errorMessage: e.message,
      profile: fallbackProfile,
      missingFields: missing,
      reply,
      done: missing.length === 0,
      summary: missing.length === 0 ? buildSummary(fallbackProfile) : null,
    };
  }
};

const authorizePhone = async (event) => {
  const wxContext = cloud.getWXContext();
  const phoneCode = String(event.code || "");
  const next = ["register", "jobs", "entry"].includes(event.next) ? event.next : "entry";
  const now = db.serverDate();

  if (!phoneCode) {
    return {
      success: false,
      errorMessage: "请先授权手机号",
    };
  }

  let phoneInfo = null;
  try {
    const response = await cloud.openapi.phonenumber.getPhoneNumber({
      code: phoneCode,
    });
    phoneInfo = response.phoneInfo || response.PhoneInfo || null;
  } catch (e) {
    return {
      success: false,
      errorMessage: e.message || "手机号验证失败",
    };
  }

  const phoneNumber = phoneInfo && (phoneInfo.phoneNumber || phoneInfo.purePhoneNumber);
  if (!phoneNumber) {
    return {
      success: false,
      errorMessage: "没有获取到手机号，请重新授权",
    };
  }

  try {
    await db.collection("user_phone_authorizations").add({
      data: {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID || "",
        next,
        phoneNumber,
        purePhoneNumber: phoneInfo.purePhoneNumber || "",
        countryCode: phoneInfo.countryCode || "",
        createdAt: now,
      },
    });
  } catch (e) {
    return {
      success: false,
      errorMessage: "手机号保存失败，请稍后重试",
    };
  }

  return {
    success: true,
    openid: wxContext.OPENID,
    phoneAuthorized: true,
    phoneNumber,
  };
};

const saveManualPhone = async (event) => {
  const wxContext = cloud.getWXContext();
  const phoneNumber = String(event.phoneNumber || "").replace(/\s+/g, "");
  const next = event.next === "register" ? "register" : "jobs";

  if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
    return {
      success: false,
      errorMessage: "请输入正确手机号",
    };
  }

  const record = {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || "",
    next,
    phoneNumber,
    source: "manual",
    createdAt: db.serverDate(),
  };

  try {
    await db.collection("user_phone_authorizations").add({
      data: record,
    });
  } catch (e) {
    try {
      await db.createCollection("user_phone_authorizations");
      await db.collection("user_phone_authorizations").add({
        data: record,
      });
    } catch (retryError) {
      return {
        success: false,
        errorMessage: retryError.message || e.message || "手机号保存失败，请稍后重试",
      };
    }
  }

  return {
    success: true,
    openid: wxContext.OPENID,
    phoneAuthorized: true,
    phoneNumber,
  };
};

// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const {
    buffer
  } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "aiProfileChat":
      return await aiProfileChat(event);
    case "recognizeSpeech":
      return await recognizeSpeech(event);
    case "synthesizeSpeech":
      return await synthesizeSpeech(event);
    case "authorizePhone":
      return await authorizePhone(event);
    case "saveManualPhone":
      return await saveManualPhone(event);
    default:
      return {
        success: false,
        errorMessage: `Unsupported function type: ${event.type || ""}`,
      };
  }
};
