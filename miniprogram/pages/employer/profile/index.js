// 我的页
Page({
  data: {
    employerInfo: {
      avatar: 'male', // male 或 female
      name: '未填写',
      type: '个人',
      city: '',
      phone: '',
      verified: false,
    },
    avatarText: '未',
  },

  onLoad() {
    this.loadEmployerInfo();
  },

  onShow() {
    // 每次显示页面时重新加载，以便显示更新后的信息
    this.loadEmployerInfo();
  },

  loadEmployerInfo() {
    // 从存储中获取雇主数据
    const employerData = wx.getStorageSync('employerData') || wx.getStorageSync('tempEmployerData');
    if (!employerData) {
      const avatarText = this.data.employerInfo.name.slice(0, 1);
      if (this.data.avatarText !== avatarText || this.data.employerInfo.verified !== false) {
        this.setData({
          avatarText,
          'employerInfo.verified': false,
        });
      }
      return;
    }

    const nextInfo = {
      ...this.data.employerInfo,
      avatar: employerData.avatar || 'male',
      name: employerData.name || '雇主',
      type: employerData.type || '个人',
      city: employerData.city || '',
      phone: employerData.phone || '',
      verified: employerData.verified || false,
    };
    const nextAvatarText = nextInfo.name.slice(0, 1);
    const current = this.data.employerInfo;
    if (
      nextInfo.name !== current.name ||
      nextInfo.type !== current.type ||
      nextInfo.city !== current.city ||
      nextInfo.phone !== current.phone ||
      nextInfo.verified !== current.verified ||
      nextAvatarText !== this.data.avatarText
    ) {
      this.setData({
        employerInfo: nextInfo,
        avatarText: nextAvatarText,
      });
    }
  },

  onProfileEdit() {
    wx.navigateTo({ url: '/pages/employer/company-info/index' });
  },

  onVerifyTap() {
    wx.navigateTo({ url: '/pages/employer/verify/index' });
  },

  onSwitchToWorker() {
    wx.setStorageSync('currentRole', 'worker');
    wx.switchTab({
      url: '/pages/jobs/index',
    });
  },

  onMenuItemTap(e) {
    const routes = {
      company:  '/pages/employer/company-info/index',
      security: '/pages/employer/security/index',
      feedback: '/pages/employer/feedback/index',
      about:    '/pages/employer/about/index',
      settings: '/pages/employer/settings/index',
    };
    const url = routes[e.currentTarget.dataset.action];
    if (url) wx.navigateTo({ url });
  },
});
