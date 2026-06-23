// 设置页面
Page({
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '清除成功',
            icon: 'success',
          });
        }
      },
    });
  },

  onCheckUpdate() {
    wx.showToast({
      title: '已是最新版本',
      icon: 'none',
    });
  },

  onContact() {
    wx.showToast({
      title: '客服功能开发中',
      icon: 'none',
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('employerData');
          wx.removeStorageSync('isLoggedIn');

          wx.setStorageSync('currentRole', 'worker');
          wx.redirectTo({
            url: '/pages/role-select/index',
          });
        }
      },
    });
  },
});
