const requiredFields = [
  { key: "title", label: "岗位名称", ask: "您想招什么岗位？比如护工、保洁、门卫。" },
  { key: "salary", label: "薪资待遇", ask: "这个岗位薪资是多少？比如 160元/天、45元/小时。" },
  { key: "location", label: "工作地点", ask: "工作地点在哪里？可以说南京哪个区或附近地标。" },
  { key: "workTime", label: "工作时间", ask: "工作时间怎么安排？比如上午半天、9:00-17:00、做六休一。" },
  { key: "recruitCount", label: "招聘人数", ask: "需要招几个人？" },
  { key: "requirements", label: "岗位要求", ask: "对求职者有什么要求？比如身体健康、有耐心、会接电话。" },
  { key: "phone", label: "联系电话", ask: "最后留一个联系电话，报名成功后双方同意才会展示。" },
];

const jobWords = ["护工", "保洁", "门卫", "保安", "食堂帮工", "帮工", "理货员", "理货", "陪诊员", "陪诊", "钟点工", "家政", "分拣员", "分拣"];
const districts = ["玄武", "秦淮", "建邺", "鼓楼", "雨花台", "栖霞", "江宁", "浦口", "六合", "溧水", "高淳"];

function createMessage(role, content) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalizePhone(text) {
  const match = String(text || "").match(/1[3-9]\d{9}/);
  return match ? match[0] : "";
}

function inferTitle(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const matched = jobWords.find((word) => compact.includes(word));
  if (!matched) return "";
  if (matched === "帮工" && compact.includes("食堂")) return "食堂帮工";
  if (matched === "理货") return "理货员";
  if (matched === "陪诊") return "陪诊员";
  if (matched === "分拣") return "分拣员";
  return matched;
}

function inferSalary(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const match = compact.match(/(\d{2,5})(?:元|块)(?:钱)?(?:\/?(天|日|小时|时|月|次|半天))?/);
  if (!match) return "";
  const unitMap = {
    天: "天",
    日: "天",
    小时: "小时",
    时: "小时",
    月: "月",
    次: "次",
    半天: "半天",
  };
  const unit = unitMap[match[2]] || (compact.includes("一天") || compact.includes("每天") ? "天" : "");
  return unit ? `${match[1]}元/${unit}` : `${match[1]}元`;
}

function inferLocation(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const nanjing = compact.match(/南京[^，。,.；;、]{0,10}/);
  if (nanjing) return nanjing[0];
  const district = districts.find((word) => compact.includes(word));
  return district ? `南京${district}区` : "";
}

function inferWorkTime(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const range = compact.match(/([0-2]?\d[:：][0-5]\d)[-到至~—]+([0-2]?\d[:：][0-5]\d)/);
  if (range) return `${range[1].replace("：", ":")}-${range[2].replace("：", ":")}`;
  const hourRange = compact.match(/([0-2]?\d)点[-到至~—]+([0-2]?\d)点/);
  if (hourRange) return `${hourRange[1]}:00-${hourRange[2]}:00`;
  const words = ["上午半天", "下午半天", "上午", "下午", "全天", "白天", "半天", "周末", "做六休一", "可排班"];
  const matched = words.filter((word) => compact.includes(word));
  return matched.join("，");
}

function inferRecruitCount(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const match = compact.match(/(?:招|要|需要)(\d{1,2})(?:个|人)|(\d{1,2})(?:个|人)/);
  return match ? String(match[1] || match[2]) : "";
}

function inferAgeRequirement(text) {
  const compact = String(text || "").replace(/\s+/g, "");
  const match = compact.match(/([4-7]\d)[-到至~—]+([4-7]\d)岁?/);
  if (match) return `${match[1]}-${match[2]}岁`;
  const under = compact.match(/([4-7]\d)岁?以下/);
  if (under) return `${under[1]}岁以下`;
  return "";
}

function inferRequirements(text, title) {
  const value = cleanText(text);
  if (!value) return "";
  const hints = ["要求", "需要", "最好", "身体", "经验", "耐心", "会", "能", "认真", "健康"];
  if (hints.some((word) => value.includes(word))) return value.slice(0, 120);
  if (title && value.length > 8) return value.slice(0, 120);
  return "";
}

function buildDescription(draft) {
  const parts = [];
  if (draft.title) parts.push(`招聘${draft.title}`);
  if (draft.location) parts.push(`地点在${draft.location}`);
  if (draft.workTime) parts.push(`工作时间${draft.workTime}`);
  if (draft.salary) parts.push(`薪资${draft.salary}`);
  const base = parts.length ? `${parts.join("，")}。` : "";
  const req = draft.requirements ? `岗位要求：${draft.requirements}` : "";
  return `${base}${req}`.slice(0, 500);
}

Page({
  data: {
    messages: [
      createMessage("ai", "您好！我是 AI 发布助手。请直接说您想招什么人，比如：南京鼓楼招护工，160元/天，8点到18点，需要身体健康、有耐心。"),
    ],
    inputContent: "",
    canSend: false,
    isLoading: false,
    submitting: false,
    draft: {
      title: "",
      salary: "",
      location: "",
      workTime: "",
      recruitCount: "",
      ageRequirement: "",
      requirements: "",
      description: "",
      phone: "",
    },
    missingLabels: [],
    missingText: "",
    draftReady: false,
    scrollIntoView: "",
  },

  onLoad() {
    const employerData = wx.getStorageSync("employerData") || wx.getStorageSync("tempEmployerData") || {};
    const phone = normalizePhone(employerData.phone || "");
    if (phone) {
      this.updateDraft({ phone }, false);
    } else {
      this.refreshDraftStatus(this.data.draft);
    }
  },

  onInput(e) {
    const inputContent = e.detail.value;
    this.setData({
      inputContent,
      canSend: Boolean(inputContent.trim()),
    });
  },

  onSend() {
    const content = this.data.inputContent.trim();
    if (!content || this.data.isLoading || this.data.submitting) return;

    const messages = this.data.messages.concat(createMessage("user", content));
    this.setData({
      messages,
      inputContent: "",
      canSend: false,
      isLoading: true,
      scrollIntoView: "chat-bottom",
    });

    const patch = this.extractDraftPatch(content, this.data.draft);
    const draft = this.mergeDraft(this.data.draft, patch);
    draft.description = buildDescription(draft);
    const reply = this.buildAiReply(draft, patch);
    this.setData({
      messages: messages.concat(createMessage("ai", reply)),
      isLoading: false,
      scrollIntoView: "chat-bottom",
    });
    this.updateDraft(draft, false);
  },

  extractDraftPatch(content, currentDraft) {
    const title = inferTitle(content);
    const patch = {
      title,
      salary: inferSalary(content),
      location: inferLocation(content),
      workTime: inferWorkTime(content),
      recruitCount: inferRecruitCount(content),
      ageRequirement: inferAgeRequirement(content),
      phone: normalizePhone(content),
    };
    patch.requirements = inferRequirements(content, title || currentDraft.title);
    return patch;
  },

  mergeDraft(current, patch) {
    const next = Object.assign({}, current);
    Object.keys(patch).forEach((key) => {
      if (patch[key]) next[key] = patch[key];
    });
    if (!next.recruitCount && next.title) next.recruitCount = "1";
    return next;
  },

  updateDraft(draft, appendReply = true) {
    this.refreshDraftStatus(draft);
    if (appendReply) {
      this.setData({
        messages: this.data.messages.concat(createMessage("ai", this.buildAiReply(draft, {}))),
        scrollIntoView: "chat-bottom",
      });
    }
  },

  refreshDraftStatus(draft) {
    const missing = requiredFields.filter((field) => !draft[field.key]);
    this.setData({
      draft,
      missingLabels: missing.map((field) => field.label),
      missingText: missing.map((field) => field.label).join("、"),
      draftReady: missing.length === 0,
    });
  },

  buildAiReply(draft, patch) {
    const captured = Object.keys(patch || {}).filter((key) => patch[key]);
    const missing = requiredFields.filter((field) => !draft[field.key]);
    if (!missing.length) {
      return "岗位信息已经齐了。我已整理好草稿，您确认无误后可以直接发布。";
    }
    if (captured.length) {
      return `我已记下：${captured.map((key) => this.getFieldLabel(key)).join("、")}。${missing[0].ask}`;
    }
    return missing[0].ask;
  },

  getFieldLabel(key) {
    const field = requiredFields.find((item) => item.key === key);
    const labels = {
      ageRequirement: "年龄要求",
      description: "岗位描述",
    };
    return field ? field.label : (labels[key] || key);
  },

  editManual() {
    wx.setStorageSync("aiJobDraft", this.data.draft);
    wx.navigateTo({
      url: "/pages/employer/publish-form/index?from=ai",
    });
  },

  async onConfirmJob() {
    if (this.data.submitting) return;
    if (!this.data.draftReady) {
      const nextMissing = requiredFields.find((field) => !this.data.draft[field.key]);
      wx.showToast({ title: `还缺${nextMissing ? nextMissing.label : "信息"}`, icon: "none" });
      if (nextMissing) {
        this.setData({
          messages: this.data.messages.concat(createMessage("ai", nextMissing.ask)),
          scrollIntoView: "chat-bottom",
        });
      }
      return;
    }

    wx.showModal({
      title: "确认发布",
      content: `${this.data.draft.title}\n${this.data.draft.salary}\n${this.data.draft.location}`,
      confirmText: "发布",
      success: async (res) => {
        if (!res.confirm) return;
        await this.publishJob();
      },
    });
  },

  async publishJob() {
    this.setData({ submitting: true });
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "createEmployerJob",
          job: this.data.draft,
        },
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || "发布失败", icon: "none" });
        return;
      }
      wx.removeStorageSync("aiJobDraft");
      wx.showToast({ title: "发布成功", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: "/pages/employer/jobs/index" });
      }, 900);
    } catch (e) {
      wx.showToast({ title: "发布失败，请检查云开发", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
