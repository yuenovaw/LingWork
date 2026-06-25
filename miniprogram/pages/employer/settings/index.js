// 设置页面
Page({
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (!res.confirm) return;
        try {
          wx.clearStorageSync();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '清除失败', icon: 'none' });
        }
      },
    });
  },

  onCheckUpdate() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '发现新版本',
            content: '新版本已就绪，是否立即重启更新？',
            success: (r) => {
              if (r.confirm) updateManager.applyUpdate();
            },
          });
        });
        updateManager.onUpdateFailed(() => {
          wx.showToast({ title: '更新下载失败，请稍后重试', icon: 'none' });
        });
      } else {
        wx.showToast({ title: '已是最新版本', icon: 'none' });
      }
    });
  },

  onContact() {
    wx.showToast({ title: '客服功能开发中', icon: 'none' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('employerData');
          wx.removeStorageSync('isLoggedIn');
          wx.setStorageSync('currentRole', 'worker');
          wx.redirectTo({ url: '/pages/role-select/index' });
        }
      },
    });
  },
});
