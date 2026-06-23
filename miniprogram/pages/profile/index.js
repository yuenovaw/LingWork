const { worker } = require("../../utils/mockData");

Page({
  data: {
    worker,
    role: "worker",
    aiProfile: null,
    displayWorker: worker
  },

  onShow() {
    const aiProfile = wx.getStorageSync("workerProfile") || null;
    const authorizedPhone = wx.getStorageSync("authorizedPhone") || "";
    const displayWorker = Object.assign({}, worker, aiProfile || {});
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
      displayWorker
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
    wx.showModal({
      title: "联系客服",
      content: "测试版本暂未接入真实客服。后续可接微信客服、电话客服或家属协助入口。",
      confirmText: "知道了",
      showCancel: false
    });
  }
});
