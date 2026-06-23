// 认证页面
Page({
  data: {
    isVerified: false,
  },

  onLoad() {
    this.checkVerifyStatus();
  },

  onShow() {
    // 每次显示时检查认证状态
    this.checkVerifyStatus();
  },

  checkVerifyStatus() {
    const employerData = wx.getStorageSync('employerData') || {};
    const isVerified = employerData.verified || false;
    this.setData({ isVerified });
  },

  onSubmit() {
    // 更新认证状态到存储
    const employerData = wx.getStorageSync('employerData') || {};
    employerData.verified = true;
    wx.setStorageSync('employerData', employerData);

    // 同时更新单独的认证状态标识（兼容性）
    wx.setStorageSync('employerVerified', true);

    // 更新当前页面状态
    this.setData({ isVerified: true });

    wx.showToast({
      title: '认证成功',
      icon: 'success',
      duration: 2000,
    });
  },
});
