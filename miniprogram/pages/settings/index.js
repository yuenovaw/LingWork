const { worker } = require("../../utils/mockData");

Page({
  data: {
    worker,
    section: "all",
    settings: {
      jobNotice: true,
      applicationNotice: true,
      contactNotice: true,
      privacyContact: true,
      familyNotice: false,
      voiceHelp: true
    }
  },

  onLoad(options) {
    this.setData({
      section: options.section || "all"
    });
  },

  toggleSetting(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      [`settings.${key}`]: e.detail.value
    });
  },

  tapItem(e) {
    wx.showToast({
      title: `${e.currentTarget.dataset.name}后续接入`,
      icon: "none"
    });
  },

  openAgreement(e) {
    const type = e.currentTarget.dataset.type || "user";
    wx.navigateTo({
      url: `/pages/agreement/index?preview=1&type=${type}`
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
