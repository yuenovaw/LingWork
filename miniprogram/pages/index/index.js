Page({
  data: {
    entering: false,
    name: "",
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

  enterWithPhone(name, phoneNumber) {
    wx.setStorageSync("pendingEntryName", name);
    wx.setStorageSync("pendingEntryPhone", phoneNumber);
    this.goRegister();
  },

  onNameInput(e) {
    this.setData({ name: String(e.detail.value || "") });
  },

  onPhoneInput(e) {
    const phoneNumber = String(e.detail.value || "").replace(/\D/g, "").slice(0, 11);
    this.setData({ phoneNumber });
  },

  onEntryTap() {
    if (this.data.entering) return;
    const name = String(this.data.name || "").trim();
    const phoneNumber = String(this.data.phoneNumber || "").replace(/\s+/g, "");

    if (name.length < 2) {
      wx.showToast({ title: "请填写姓名", icon: "none" });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      wx.showToast({ title: "请输入正确手机号", icon: "none" });
      return;
    }
    this.enterWithPhone(name, phoneNumber);
  }
});
