const { isLegacyDemoWorkerProfile } = require("../../utils/storage");

Page({
  data: {
    role: "worker",
    aiProfile: null,
    displayWorker: {
      name: "未登记",
      age: "",
      city: "南京",
      district: "",
      realNameStatus: "待完善资料",
      maskedPhone: ""
    },
    displayNameAge: "未登记"
  },

  onShow() {
    let aiProfile = wx.getStorageSync("workerProfile") || null;
    if (isLegacyDemoWorkerProfile(aiProfile)) {
      wx.removeStorageSync("workerProfile");
      wx.removeStorageSync("authorizedPhone");
      wx.removeStorageSync("phoneAuthorized");
      aiProfile = null;
    }
    const authorizedPhone = wx.getStorageSync("authorizedPhone") || "";
    const displayWorker = Object.assign({
      name: "未登记",
      age: "",
      city: "南京",
      district: "",
      realNameStatus: "待完善资料",
      maskedPhone: ""
    }, aiProfile || {});
    if (authorizedPhone) {
      displayWorker.phone = authorizedPhone;
      displayWorker.maskedPhone = `${authorizedPhone.slice(0, 3)}****${authorizedPhone.slice(-4)}`;
    }
    if (displayWorker.city) {
      const cityText = String(displayWorker.city);
      displayWorker.city = cityText.startsWith("南京") ? cityText : `南京${cityText}`;
      displayWorker.district = "";
    }
    displayWorker.realNameStatus = aiProfile ? "资料已登记" : "待完善资料";

    this.setData({
      role: wx.getStorageSync("currentRole") || "worker",
      aiProfile,
      displayWorker,
      displayNameAge: displayWorker.age ? `${displayWorker.name} · ${displayWorker.age}岁` : displayWorker.name
    });
  },

  switchRole() {
    wx.showActionSheet({
      itemList: ["我是找工者", "我是雇主"],
      success: (res) => {
        const role = res.tapIndex === 0 ? "worker" : "employer";
        wx.setStorageSync("currentRole", role);
        this.setData({ role });
        if (role === "employer") {
          wx.redirectTo({ url: "/pages/employer/home/index" });
          return;
        }
        wx.showToast({ title: "已切到找工者", icon: "none" });
      }
    });
  },

  editAiProfile() {
    wx.navigateTo({
      url: "/pages/ai-onboarding/index"
    });
  },

  goApplications() {
    wx.switchTab({
      url: "/pages/applications/index"
    });
  },

  goSettings(e) {
    const section = e.currentTarget.dataset.section || "all";
    wx.navigateTo({
      url: `/pages/settings/index?section=${section}`
    });
  },

  callService() {
    wx.navigateTo({
      url: "/pages/employer/feedback/index?from=workerProfile"
    });
  }
});
