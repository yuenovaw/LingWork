const { extractProfile, getMissingSlots, buildReply, buildSummary } = require("../../utils/aiProfileAgent");

const welcomeMessage = {
  id: "welcome",
  role: "ai",
  text: "您好，我是找龄工 AI。请像打电话一样告诉我：怎么称呼您？"
};

const nonNanjingCities = ["北京", "上海", "广州", "深圳", "苏州", "杭州", "天津", "重庆", "成都", "武汉", "西安", "合肥"];
const nanjingLocationQuestion = "目前主要支持南京地区找工。您可以说南京哪个区，或者附近地标，比如“南京鼓楼附近”“新街口附近”。";

function createMessage(role, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text
  };
}

function mentionsOutsideNanjing(text) {
  const cleaned = String(text || "").replace(/\s+/g, "");
  return nonNanjingCities.some((word) => cleaned.includes(word));
}

function isOutsideNanjingLocation(location) {
  const cleaned = String(location || "").replace(/\s+/g, "");
  return nonNanjingCities.some((word) => cleaned.includes(word));
}

function normalizeProfile(profile) {
  const next = Object.assign({}, profile || {});
  if (next.age) {
    const match = String(next.age).match(/([4-7]\d)/);
    if (match) next.age = match[1];
  }
  if (next.phone) {
    const match = String(next.phone).match(/1[3-9]\d{9}/);
    if (match) next.phone = match[0];
  }
  if (isOutsideNanjingLocation(next.city)) {
    next.city = "";
  }
  return next;
}

Page({
  data: {
    inputText: "",
    profile: {},
    messages: [welcomeMessage],
    completed: false,
    summary: null,
    thinking: false,
    recognizing: false,
    recording: false,
    speaking: false,
    speakerEnabled: true,
    showKeyboard: false,
    voiceTip: "按住说话",
    voiceStatus: "按住中间按钮，像打电话一样说",
    speechStatus: "AI 回复会自动播报",
    progressText: "还差 6 项",
    scrollIntoView: "welcome",
    mode: "select",
    locating: false,
    manualForm: {
      name: "", age: "", city: "", expectedJobs: "",
      availableTime: "", phone: "", experience: "", healthStatus: ""
    },
    jobOptions: ["门卫/保安", "保洁/清洁", "超市导购", "餐厅服务", "配送员", "停车管理员", "绿化工", "其他"],
    timeOptions: ["全天", "上午", "下午", "周末", "弹性时间"]
  },

  onLoad() {
    const phone = wx.getStorageSync("authorizedPhone") || "";
    const profile = phone ? { phone } : {};
    const progressText = this.getProgressText(profile);
    this.setData({ profile, progressText });

    this.recorder = wx.getRecorderManager();
    this.audio = wx.createInnerAudioContext();
    this.audio.obeyMuteSwitch = false;
    this.audio.onPlay(() => {
      this.setData({
        speaking: true,
        speechStatus: "正在播报 AI 回复"
      });
    });
    this.audio.onEnded(() => {
      this.setData({
        speaking: false,
        speechStatus: "AI 回复会自动播报"
      });
    });
    this.audio.onStop(() => {
      this.setData({
        speaking: false,
        speechStatus: "已停止播报"
      });
    });
    this.audio.onError(() => {
      this.setData({
        speaking: false,
        speechStatus: "播报失败，可继续看文字"
      });
    });
    this.recordStartAt = 0;
    this.recordCanceled = false;
    this.recorder.onStop((res) => {
      if (this.recordCanceled) {
        this.recordCanceled = false;
        this.setData({
          recording: false,
          recognizing: false,
          thinking: false,
          voiceTip: "按住说话",
          voiceStatus: "录音已取消"
        });
        return;
      }
      const duration = Date.now() - this.recordStartAt;
      if (duration < 650) {
        this.setData({
          recording: false,
          recognizing: false,
          thinking: false,
          voiceTip: "按住说话",
          voiceStatus: "说话时间太短，请按住后说完整一句"
        });
        wx.showToast({ title: "说话时间太短", icon: "none" });
        return;
      }
      this.setData({
        recording: false,
        recognizing: true,
        thinking: true,
        voiceTip: "正在识别...",
        voiceStatus: "我正在把语音转成文字"
      });
      this.recognizeVoice(res.tempFilePath);
    });
    this.recorder.onError(() => {
      this.setData({
        recording: false,
        recognizing: false,
        thinking: false,
        voiceTip: "按住说话",
        voiceStatus: "录音失败，请再试一次"
      });
      wx.showToast({ title: "录音失败，请重试", icon: "none" });
    });
  },

  onReady() {
  },

  onUnload() {
    if (this.orbTimer) {
      clearInterval(this.orbTimer);
      this.orbTimer = null;
    }
    if (this.data.recording && this.recorder) {
      this.recordCanceled = true;
      this.recorder.stop();
    }
    if (this.audio) {
      this.audio.destroy();
    }
  },

  startOrbAnimation() {
    if (this.orbTimer) {
      clearInterval(this.orbTimer);
      this.orbTimer = null;
    }

    wx.createSelectorQuery()
      .in(this)
      .select("#siriOrbCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        const target = res && res[0];
        if (!target || !target.node || !target.width || !target.height) return;

        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        const canvas = target.node;
        const ctx = canvas.getContext("2d");
        canvas.width = target.width * dpr;
        canvas.height = target.height * dpr;
        ctx.scale(dpr, dpr);

        this.orbCanvas = canvas;
        this.orbCtx = ctx;
        this.orbWidth = target.width;
        this.orbHeight = target.height;
        this.orbFrame = 0;
        this.drawOrbFrame();
        this.orbTimer = setInterval(() => {
          this.drawOrbFrame();
        }, 42);
      });
  },

  drawOrbFrame() {
    const ctx = this.orbCtx;
    if (!ctx) return;

    const width = this.orbWidth || 160;
    const height = this.orbHeight || 160;
    const size = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2;
    const radius = size * 0.468;
    const frame = this.orbFrame || 0;
    const t = frame * 0.068;
    const isActive = this.data.recording || this.data.speaking || this.data.thinking;
    const energy = isActive ? 1.38 : 1;

    const drawEllipse = (x, y, rx, ry, fillStyle, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(rx, ry);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.restore();
    };

    const riverY = (x, layer) => {
      const n = (x - cx) / radius;
      return layer.base
        + Math.sin(n * layer.waveA + t * layer.speed + layer.phase) * layer.amp
        + Math.sin(n * layer.waveB - t * (layer.speed * 0.78) + layer.phase * 1.7) * layer.amp * 0.38;
    };

    const drawRiver = (layer) => {
      const left = cx - radius * layer.reach;
      const right = cx + radius * layer.reach;
      const steps = 34;
      const top = [];
      const bottom = [];
      for (let i = 0; i <= steps; i += 1) {
        const x = left + ((right - left) * i) / steps;
        const n = i / steps;
        const taper = Math.sin(Math.PI * n);
        const center = riverY(x, layer);
        const wobble = 1 + Math.sin(t * 1.6 + n * 9 + layer.phase) * 0.16;
        const half = layer.thickness * (0.3 + taper * 0.7) * wobble;
        top.push({ x, y: center - half });
        bottom.push({ x, y: center + half });
      }

      const gradient = ctx.createLinearGradient(left, cy, right, cy);
      layer.stops.forEach((stop) => {
        gradient.addColorStop(stop[0], stop[1]);
      });

      ctx.save();
      ctx.globalAlpha = layer.alpha;
      ctx.shadowColor = layer.glow;
      ctx.shadowBlur = layer.blur;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      top.forEach((point) => ctx.lineTo(point.x, point.y));
      for (let i = bottom.length - 1; i >= 0; i -= 1) {
        ctx.lineTo(bottom[i].x, bottom[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawRimArc = (start, end, color, widthScale, blurScale, alpha, drift, pulse) => {
      const flow = t * drift;
      const lengthPulse = Math.sin(t * pulse + start * 1.7) * 0.075;
      const shimmer = 0.78 + Math.sin(t * 1.15 + start * 2.1) * 0.22;
      const nextStart = start + flow - lengthPulse;
      const nextEnd = end + flow + lengthPulse;
      ctx.save();
      ctx.globalAlpha = alpha * shimmer;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1, radius * widthScale);
      ctx.shadowColor = color;
      ctx.shadowBlur = radius * blurScale;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - ctx.lineWidth * 0.65, nextStart, nextEnd);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * shimmer * 0.28;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1, radius * widthScale * 1.65);
      ctx.shadowColor = color;
      ctx.shadowBlur = radius * blurScale * 1.5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - ctx.lineWidth * 0.35, nextStart - 0.1, nextEnd - 0.2);
      ctx.stroke();
      ctx.restore();
    };

    const drawRainbowRim = () => {
      const segment = (Math.PI * 2) / 7;
      const flow = t * 0.72;
      const colors = [
        "rgba(255, 61, 82, 0.72)",
        "rgba(255, 139, 38, 0.72)",
        "rgba(255, 229, 68, 0.68)",
        "rgba(74, 232, 126, 0.66)",
        "rgba(52, 224, 224, 0.68)",
        "rgba(49, 124, 255, 0.72)",
        "rgba(159, 82, 255, 0.7)"
      ];

      colors.forEach((color, index) => {
        const phase = index * segment + flow;
        const start = phase - segment * 0.34;
        const end = phase + segment * (0.38 + Math.sin(t * 1.8 + index) * 0.08);
        drawRimArc(start, end, color, 0.018 + (index % 2) * 0.006, 0.075, 0.5, 0.08, 1.9 + index * 0.08);
      });
    };

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const glass = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.36, radius * 0.06, cx, cy, radius);
    glass.addColorStop(0, "rgba(255, 255, 255, 0.84)");
    glass.addColorStop(0.2, "rgba(246, 243, 255, 0.76)");
    glass.addColorStop(0.48, "rgba(220, 208, 252, 0.58)");
    glass.addColorStop(0.74, "rgba(186, 165, 235, 0.44)");
    glass.addColorStop(1, "rgba(152, 128, 210, 0.36)");
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, width, height);

    drawEllipse(cx, cy + radius * 0.02, radius * 1.28, radius * 0.24, "rgba(255, 255, 245, 0.38)", 0.46);

    drawRiver({
      base: cy - radius * 0.03,
      thickness: radius * 0.17,
      amp: radius * 0.06 * energy,
      reach: 1.08,
      waveA: 5.8,
      waveB: 11,
      speed: 1.05 * energy,
      phase: 0.2,
      alpha: 0.78,
      blur: radius * 0.09,
      glow: "rgba(60, 200, 255, 0.58)",
      stops: [
        [0, "rgba(0, 93, 255, 0)"],
        [0.14, "rgba(0, 139, 255, 0.86)"],
        [0.32, "rgba(0, 231, 202, 0.92)"],
        [0.5, "rgba(255, 255, 238, 0.86)"],
        [0.67, "rgba(255, 42, 214, 0.88)"],
        [0.85, "rgba(255, 145, 39, 0.78)"],
        [1, "rgba(255, 145, 39, 0)"]
      ]
    });

    drawRiver({
      base: cy - radius * 0.11,
      thickness: radius * 0.12,
      amp: radius * 0.09 * energy,
      reach: 0.82,
      waveA: 7.2,
      waveB: 13.6,
      speed: 1.32 * energy,
      phase: 1.6,
      alpha: 0.72,
      blur: radius * 0.07,
      glow: "rgba(120, 255, 158, 0.45)",
      stops: [
        [0, "rgba(0, 174, 255, 0)"],
        [0.18, "rgba(45, 203, 255, 0.55)"],
        [0.42, "rgba(45, 235, 121, 0.9)"],
        [0.58, "rgba(255, 255, 242, 0.88)"],
        [0.78, "rgba(255, 89, 225, 0.7)"],
        [1, "rgba(255, 89, 225, 0)"]
      ]
    });

    drawRiver({
      base: cy + radius * 0.06,
      thickness: radius * 0.13,
      amp: radius * 0.075 * energy,
      reach: 0.96,
      waveA: 6.4,
      waveB: 10.2,
      speed: 0.88 * energy,
      phase: 3.2,
      alpha: 0.58,
      blur: radius * 0.08,
      glow: "rgba(255, 82, 194, 0.5)",
      stops: [
        [0, "rgba(26, 92, 255, 0)"],
        [0.2, "rgba(35, 137, 255, 0.56)"],
        [0.44, "rgba(39, 226, 132, 0.62)"],
        [0.6, "rgba(255, 255, 245, 0.8)"],
        [0.76, "rgba(255, 64, 193, 0.78)"],
        [1, "rgba(255, 176, 57, 0)"]
      ]
    });

    drawEllipse(cx + Math.sin(t * 0.9) * radius * 0.06, cy - radius * 0.01, radius * 0.46, radius * 0.1, "rgba(255, 255, 246, 0.9)", 0.72);
    drawEllipse(cx - radius * 0.07, cy - radius * 0.36, radius * 0.52, radius * 0.2, "rgba(255, 255, 255, 0.46)", 0.74);
    drawEllipse(cx, cy + radius * 0.58, radius * 0.82, radius * 0.18, "rgba(100, 80, 180, 0.12)", 0.36);

    ctx.restore();

    drawRainbowRim();
    drawRimArc(Math.PI * 1.34, Math.PI * 1.7, "rgba(255, 255, 255, 0.82)", 0.014, 0.055, 0.42, 0.28, 2.2);

    const rim = ctx.createRadialGradient(cx, cy, radius * 0.72, cx, cy, radius * 1.02);
    rim.addColorStop(0, "rgba(255, 255, 255, 0)");
    rim.addColorStop(0.76, "rgba(255, 255, 255, 0.04)");
    rim.addColorStop(0.9, "rgba(218, 255, 237, 0.12)");
    rim.addColorStop(1, "rgba(255, 255, 255, 0.2)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.save();
    ctx.lineWidth = Math.max(1, size * 0.008);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(90, 215, 255, 0.24)";
    ctx.beginPath();
    ctx.arc(cx - radius * 0.04, cy, radius - 2, Math.PI * 0.72, Math.PI * 1.3);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 126, 88, 0.22)";
    ctx.beginPath();
    ctx.arc(cx + radius * 0.04, cy, radius - 2, Math.PI * 1.72, Math.PI * 0.3);
    ctx.stroke();
    ctx.restore();

    this.orbFrame = frame + 1;
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendText() {
    const text = this.data.inputText.trim();
    if (!text || this.data.thinking) return;
    this.handleUserText(text);
  },

  useQuickReply(e) {
    const text = e.currentTarget.dataset.text;
    if (!text || this.data.thinking) return;
    this.handleUserText(text);
  },

  async handleUserText(text) {
    const userMessage = createMessage("user", text);
    const localProfile = normalizeProfile(extractProfile(text, this.data.profile));
    const messages = this.data.messages.concat(userMessage);

    this.setData({
      inputText: "",
      messages,
      profile: localProfile,
      thinking: true,
      scrollIntoView: "transcript-bottom",
      progressText: this.getProgressText(localProfile)
    });

    const aiResult = await this.askAi(text, localProfile);
    const profile = normalizeProfile(aiResult.profile || localProfile);
    if (mentionsOutsideNanjing(text)) {
      profile.city = "";
    }
    const missingSlots = getMissingSlots(profile);
    const done = missingSlots.length === 0;
    const aiText = done
      ? "信息齐了，我已经帮您整理成一份找工资料。您可以检查一下。"
      : (missingSlots[0] && missingSlots[0].key === "city"
        ? nanjingLocationQuestion
        : (aiResult.reply || buildReply(profile).text));
    const aiMessage = createMessage("ai", aiText);

    if (done) {
      const summary = Object.assign(buildSummary(profile), aiResult.summary || {});
      const authorizedPhone = wx.getStorageSync("authorizedPhone") || "";
      if (authorizedPhone) summary.phone = authorizedPhone;
      wx.setStorageSync("workerProfile", summary);
      this.setData({
      profile,
      completed: true,
      summary,
      thinking: false,
      messages: messages.concat(aiMessage),
      progressText: "资料已完成",
      scrollIntoView: "transcript-bottom"
    });
      this.speakAiText(aiText);
      return;
    }

    this.setData({
      profile,
      thinking: false,
      messages: messages.concat(aiMessage),
      progressText: this.getProgressText(profile),
      scrollIntoView: "transcript-bottom"
    });
    this.speakAiText(aiText);
  },

  async askAi(text, profile) {
    try {
      const history = this.data.messages
        .slice(-10)
        .map((item) => ({
          role: item.role,
          text: item.text
        }));
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "aiProfileChat",
          text,
          profile,
          messages: history
        }
      });
      const data = result.result || {};
      if (data.profile || data.reply || data.summary) return data;
    } catch (e) {
      // AI service is optional; local rules keep the flow usable.
    }
    const reply = buildReply(profile);
    return {
      profile,
      reply: reply.text,
      done: reply.done,
      summary: reply.done ? buildSummary(profile) : null
    };
  },

  getProgressText(profile) {
    const missingCount = getMissingSlots(profile).length;
    if (!missingCount) return "资料已完整";
    return `还差 ${missingCount} 项`;
  },

  async speakAiText(text) {
    if (!this.data.speakerEnabled || !text || !this.audio) return;
    try {
      this.audio.stop();
      this.setData({ speechStatus: "正在准备播报..." });
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "synthesizeSpeech",
          text
        }
      });
      const data = result.result || {};
      if (!data.success || !data.tempFileURL) {
        this.setData({ speechStatus: data.errorMessage ? `播报失败：${data.errorMessage}` : "播报失败，可继续看文字" });
        return;
      }
      this.audio.src = data.tempFileURL;
      this.audio.play();
    } catch (e) {
      this.setData({
        speaking: false,
        speechStatus: "播报失败，可继续看文字"
      });
    }
  },

  toggleSpeaker() {
    const enabled = !this.data.speakerEnabled;
    if (!enabled && this.audio) {
      this.audio.stop();
    }
    this.setData({
      speakerEnabled: enabled,
      speaking: false,
      speechStatus: enabled ? "AI 回复会自动播报" : "已关闭自动播报"
    });
  },

  toggleKeyboard() {
    this.setData({
      showKeyboard: !this.data.showKeyboard
    });
  },

  async recognizeVoice(tempFilePath) {
    if (!tempFilePath) {
      this.setData({
        recognizing: false,
        thinking: false,
        voiceTip: "按住说话",
        voiceStatus: "没有录到声音，请再试一次"
      });
      wx.showToast({ title: "没有录到声音", icon: "none" });
      return;
    }

    try {
      const voiceFormat = "aac";
      const cloudPath = `voice-profiles/${Date.now()}-${Math.random().toString(16).slice(2)}.${voiceFormat}`;
      const upload = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      });
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "recognizeSpeech",
          fileID: upload.fileID,
          voiceFormat,
          engServiceType: "16k_zh_dialect"
        }
      });
      const data = result.result || {};
      if (!data.success || !data.text) {
        wx.showToast({ title: "没听清，请再说一次", icon: "none" });
        this.setData({
          recognizing: false,
          thinking: false,
          voiceTip: "按住说话",
          voiceStatus: data.errorMessage
            ? `识别失败：${data.errorMessage}${data.audioBytes ? `（${data.audioBytes}字节）` : ""}`
            : "没听清，请再说一次"
        });
        return;
      }

      this.setData({
        recognizing: false,
        thinking: false,
        voiceTip: "按住说话",
        voiceStatus: `已识别：${data.text}`
      });
      this.handleUserText(data.text);
    } catch (e) {
      this.setData({
        recognizing: false,
        thinking: false,
        voiceTip: "按住说话",
        voiceStatus: "语音识别暂时不可用，可以先用文字发送"
      });
      wx.showModal({
        title: "语音识别失败",
        content: "请检查腾讯云 ASR 密钥和云函数配置，或先用文字填写。",
        confirmText: "知道了",
        showCancel: false
      });
    }
  },

  async startRecord() {
    if (this.data.thinking || this.data.completed) return;
    const canRecord = await this.ensureRecordPermission();
    if (!canRecord) return;
    if (this.audio) {
      this.audio.stop();
    }
    this.recordStartAt = Date.now();
    this.recordCanceled = false;
    this.setData({
      recording: true,
      recognizing: false,
      speaking: false,
      voiceTip: "正在听您说话...",
      voiceStatus: "请说话，说完松开按钮"
    });
    this.recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: "aac"
    });
  },

  stopRecord() {
    if (!this.data.recording) return;
    this.setData({ voiceStatus: "正在结束录音..." });
    this.recorder.stop();
  },

  cancelRecord() {
    if (!this.data.recording) return;
    this.recordCanceled = true;
    this.recorder.stop();
    this.setData({
      recording: false,
      recognizing: false,
      voiceTip: "按住说话",
      voiceStatus: "录音已取消"
    });
  },

  ensureRecordPermission() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (setting) => {
          if (setting.authSetting["scope.record"]) {
            resolve(true);
            return;
          }
          wx.authorize({
            scope: "scope.record",
            success: () => resolve(true),
            fail: () => {
              wx.showModal({
                title: "需要麦克风权限",
                content: "打开麦克风后，您就可以直接说话登记资料。",
                confirmText: "去打开",
                cancelText: "先不用",
                success: (res) => {
                  if (!res.confirm) {
                    resolve(false);
                    return;
                  }
                  wx.openSetting({
                    success: (nextSetting) => {
                      resolve(!!nextSetting.authSetting["scope.record"]);
                    },
                    fail: () => resolve(false)
                  });
                },
                fail: () => resolve(false)
              });
            }
          });
        },
        fail: () => resolve(true)
      });
    });
  },

  regenerateSummary() {
    const summary = buildSummary(this.data.profile);
    const authorizedPhone = wx.getStorageSync("authorizedPhone") || "";
    if (authorizedPhone) summary.phone = authorizedPhone;
    wx.setStorageSync("workerProfile", summary);
    this.setData({ summary });
    wx.showToast({ title: "已重新整理", icon: "success" });
  },

  goJobs() {
    wx.switchTab({
      url: "/pages/jobs/index"
    });
  },


  onNavClose() {
    const { mode } = this.data;
    if (mode === "select") {
      wx.navigateBack({ delta: 1 });
    } else {
      if (this.orbTimer) {
        clearInterval(this.orbTimer);
        this.orbTimer = null;
      }
      this.setData({ mode: "select" });
    }
  },

  chooseMode(e) {
    const m = e.currentTarget.dataset.mode;
    this.setData({ mode: m }, () => {
      if (m === "ai") this.startOrbAnimation();
    });
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const manualForm = Object.assign({}, this.data.manualForm, { [field]: value });
    this.setData({ manualForm });
  },

  toggleJobChip(e) {
    const val = e.currentTarget.dataset.val;
    let current = this.data.manualForm.expectedJobs || "";
    if (current.indexOf(val) !== -1) {
      current = current.replace(val, "").replace(/^[、,\s]+|[、,\s]+$/g, "").replace(/[、,\s]{2,}/g, "、");
    } else {
      current = current ? current + "、" + val : val;
    }
    this.setData({ "manualForm.expectedJobs": current });
  },

  toggleTimeChip(e) {
    const val = e.currentTarget.dataset.val;
    let current = this.data.manualForm.availableTime || "";
    if (current.indexOf(val) !== -1) {
      current = current.replace(val, "").replace(/^[、,\s]+|[、,\s]+$/g, "").replace(/[、,\s]{2,}/g, "、");
    } else {
      current = current ? current + "、" + val : val;
    }
    this.setData({ "manualForm.availableTime": current });
  },

  submitManualForm() {
    const form = this.data.manualForm;
    if (!form.name || !form.age || !form.city || !form.expectedJobs || !form.availableTime || !form.phone) {
      wx.showToast({ title: "请填写必填项", icon: "none" });
      return;
    }
    const summary = {
      name: form.name,
      age: form.age,
      city: form.city,
      expectedJobs: form.expectedJobs,
      availableTime: form.availableTime,
      phone: form.phone,
      experience: form.experience || "",
      healthStatus: form.healthStatus || "",
      resumeText: form.name + "，" + form.age + "岁，在" + form.city + "找" + form.expectedJobs + "工作，可上班时间：" + form.availableTime + "。"
    };
    wx.setStorageSync("workerProfile", summary);
    this.setData({ completed: true, summary });
  },

  async autoFillLocation() {
    if (this.data.locating) return;
    this.setData({ locating: true });
    try {
      const loc = await new Promise((resolve, reject) => {
        wx.getLocation({ type: "wgs84", success: resolve, fail: reject });
      });
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: { type: "reverseGeocode", latitude: loc.latitude, longitude: loc.longitude }
      });
      const d = result.result || {};
      if (d.city) {
        this.handleUserText("我在" + d.city);
      } else {
        wx.showToast({ title: "定位成功，请告诉AI您的附近区域", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "定位失败，请手动输入地区", icon: "none" });
    }
    this.setData({ locating: false });
  },

  async autoFillLocationManual() {
    if (this.data.locating) return;
    this.setData({ locating: true });
    try {
      const loc = await new Promise((resolve, reject) => {
        wx.getLocation({ type: "wgs84", success: resolve, fail: reject });
      });
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: { type: "reverseGeocode", latitude: loc.latitude, longitude: loc.longitude }
      });
      const d = result.result || {};
      const city = d.city || "";
      if (city) {
        this.setData({ "manualForm.city": city });
      } else {
        wx.showToast({ title: "未能获取地区，请手动输入", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "定位失败，请手动输入", icon: "none" });
    }
    this.setData({ locating: false });
  },

  skipOnboarding() {
    wx.setStorageSync("skipAiOnboarding", true);
    wx.switchTab({
      url: "/pages/jobs/index"
    });
  }
});
