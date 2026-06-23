// 首页
Page({
  data: {
    employerInfo: {
      name: '张老板',
      type: '个人',
      verified: true,
    },
    stats: {
      activeJobs: 2,
      pending: 3,
      communicating: 1,
      hired: 0,
    },
    recentJobs: [
      {
        id: '1',
        title: '养老院护工',
        salary: '160元/天',
        location: '南京鼓楼',
        status: 'active',
        pendingCount: 3,
      },
      {
        id: '2',
        title: '保洁阿姨',
        salary: '120元/天',
        location: '南京栖霞',
        status: 'active',
        pendingCount: 0,
      },
    ],
  },

  onLoad() {
    // 加载雇主信息
    this.loadEmployerInfo();
  },

  onShow() {
    // 每次显示页面时重新加载，以便显示更新后的认证状态
    this.loadEmployerInfo();
  },

  loadEmployerInfo() {
    const employerData = wx.getStorageSync('employerData') || wx.getStorageSync('tempEmployerData');
    const nextInfo = employerData ? {
      avatar: employerData.avatar || 'male',
      name: employerData.name || '雇主',
      type: employerData.type || '个人',
      verified: employerData.verified || false,
    } : this.data.employerInfo;
    const current = this.data.employerInfo;
    if (
      nextInfo.name !== current.name ||
      nextInfo.type !== current.type ||
      nextInfo.verified !== current.verified
    ) {
      this.setData({
        employerInfo: nextInfo,
      });
    }
  },

  onEmployerCardTap() {
    wx.navigateTo({
      url: '/pages/employer/profile/index',
    });
  },

  onStatTap(e) {
    const { type } = e.currentTarget.dataset;
    if (type === 'active') {
      wx.redirectTo({ url: '/pages/employer/jobs/index' });
    } else {
      wx.navigateTo({
        url: `/pages/employer/messages/index?tab=${type}`,
      });
    }
  },

  onJobTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.redirectTo({
      url: `/pages/employer/jobs/index?id=${id}`,
    });
  },

  onViewApplicants(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/employer/messages/index?jobId=${id}`,
    });
  },

  onAddJob() {
    wx.redirectTo({
      url: '/pages/employer/publish/index',
    });
  },
});
