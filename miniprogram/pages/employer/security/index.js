// 账户安全页面
Page({
  data: {
    phoneText: '未绑定',
  },

  onShow() {
    const employerData = wx.getStorageSync('employerData') || wx.getStorageSync('tempEmployerData') || {};
    const phone = String(employerData.phone || '');
    this.setData({ phoneText: this.maskPhone(phone) || '未绑定' });
  },

  maskPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
  },

  onChangePhone() {
    wx.showModal({
      title: '更换手机号',
      content: '更换手机号需重新完成实名验证。请联系客服协助处理。',
      confirmText: '知道了',
      showCancel: false,
    });
  },
});
