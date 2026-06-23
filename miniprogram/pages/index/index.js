Page({
  data: {
    entering: false,
    phoneNumber: ""
  },

  goRegister() {
    wx.navigateTo({
      url: "/pages/role-select/index"
    });
  },

  goJobs() {
    wx.setStorageSync("currentRole", "worker");
    wx.removeStorageSync("guestMode");
    wx.switchTab({
      url: "/pages/jobs/index"
    });
  },

  saveManualPhone(phoneNumber) {
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "saveManualPhone",
        phoneNumber,
        next: "entry"
      }
    }).catch((err) => {
      console.warn("saveManualPhone failed", err.message || err);
    });
  },

  enterWithPhone(phoneNumber) {
    wx.setStorageSync("phoneAuthorized", true);
    wx.setStorageSync("authorizedPhone", phoneNumber);
    this.saveManualPhone(phoneNumber);
    this.goRegister();
  },

  onPhoneInput(e) {
    const phoneNumber = String(e.detail.value || "").replace(/\D/g, "").slice(0, 11);
    this.setData({ phoneNumber });
  },

  onEntryTap() {
    if (this.data.entering) return;
    const phoneNumber = String(this.data.phoneNumber || "").replace(/\s+/g, "");

    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      wx.showToast({
        title: "请输入正确手机号",
        icon: "none"
      });
      return;
    }
    this.enterWithPhone(phoneNumber);
  }
});
