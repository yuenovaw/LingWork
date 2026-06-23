Page({
  data: {
    selectedRole: "",
    agreed: false
  },

  selectRole(e) {
    this.setData({
      selectedRole: e.currentTarget.dataset.role
    });
  },

  toggleAgree() {
    this.setData({
      agreed: !this.data.agreed
    });
  },

  nextStep() {
    if (!this.data.selectedRole) {
      wx.showToast({ title: "请先选择身份", icon: "none" });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: "请先阅读并同意协议", icon: "none" });
      return;
    }

    wx.setStorageSync("pendingRole", this.data.selectedRole);
    wx.navigateTo({
      url: `/pages/agreement/index?role=${this.data.selectedRole}`
    });
  },

  openAgreement(e) {
    const type = e.currentTarget.dataset.type || "user";
    wx.navigateTo({
      url: `/pages/agreement/index?role=${this.data.selectedRole || "worker"}&preview=1&type=${type}`
    });
  }
});
