// 关于我们页面
Page({
  onUserAgreement() {
    wx.navigateTo({ url: '/pages/agreement/index?preview=1&type=user' });
  },

  onPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/agreement/index?preview=1&type=privacy' });
  },
});
