const { agreements, getAgreement } = require("../../utils/agreements");

Page({
  data: {
    agreements,
    selectedAgreementId: "user",
    agreement: getAgreement("user"),
    role: "worker",
    preview: false,
    agreed: false,
    seconds: 10,
    canAgree: false
  },

  onLoad(options) {
    const selectedAgreementId = options.type || "user";
    this.setData({
      selectedAgreementId,
      agreement: getAgreement(selectedAgreementId),
      role: options.role || "worker",
      preview: options.preview === "1"
    });
    this.startCountdown();
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  switchAgreement(e) {
    const selectedAgreementId = e.currentTarget.dataset.id;
    this.setData({
      selectedAgreementId,
      agreement: getAgreement(selectedAgreementId)
    });
  },

  startCountdown() {
    this.timer = setInterval(() => {
      const seconds = this.data.seconds - 1;
      if (seconds <= 0) {
        clearInterval(this.timer);
        this.setData({ seconds: 0, canAgree: true });
        return;
      }
      this.setData({ seconds });
    }, 1000);
  },

  toggleAgree() {
    if (!this.data.canAgree) {
      wx.showToast({ title: `请再阅读 ${this.data.seconds} 秒`, icon: "none" });
      return;
    }
    this.setData({ agreed: !this.data.agreed });
  },

  savePendingPhone(role) {
    const phoneNumber = wx.getStorageSync("pendingEntryPhone") || "";
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) return;

    wx.setStorageSync("phoneAuthorized", true);
    wx.setStorageSync("authorizedPhone", phoneNumber);
    wx.removeStorageSync("pendingEntryPhone");

    if (role === "worker") {
      const name = String(wx.getStorageSync("pendingEntryName") || "").trim();
      wx.removeStorageSync("pendingEntryName");
      if (name) {
        const draft = wx.getStorageSync("workerProfileDraft") || {};
        if (!draft.name) {
          draft.name = name;
          wx.setStorageSync("workerProfileDraft", draft);
        }
      }
    }

    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "saveManualPhone",
        phoneNumber,
        next: role === "worker" ? "register" : "entry"
      }
    }).catch(() => {
      // Phone is stored locally for the demo flow; cloud retry can be added later.
    });
  },

  continueRegister() {
    if (this.data.preview) {
      wx.navigateBack();
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: "请先勾选同意协议", icon: "none" });
      return;
    }

    wx.setStorageSync("currentRole", this.data.role);
    wx.setStorageSync("agreementAccepted", true);
    wx.setStorageSync("acceptedAgreementIds", agreements.map((item) => item.id));
    this.savePendingPhone(this.data.role);

    if (this.data.role === "worker") {
      wx.redirectTo({ url: "/pages/ai-onboarding/index" });
      return;
    }

    wx.redirectTo({ url: "/pages/employer/home/index" });
  }
});
