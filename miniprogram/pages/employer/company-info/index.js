// 企业信息页面
Page({
  data: {
    employerInfo: {
      name: "未填写",
      type: "未填写",
      city: "未填写",
      phone: "未填写"
    }
  },

  onShow() {
    const employerData = wx.getStorageSync("employerData") || wx.getStorageSync("tempEmployerData") || {};
    const phone = String(employerData.phone || "");
    this.setData({
      employerInfo: {
        name: employerData.name || "未填写",
        type: employerData.type || "未填写",
        city: employerData.city || "未填写",
        phone: this.maskPhone(phone) || "未填写"
      }
    });
  },

  maskPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
  }
});
