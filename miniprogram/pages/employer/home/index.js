// 首页
Page({
  data: {
    employerInfo: {
      name: '未填写',
      type: '个人',
      verified: false,
    },
    stats: {
      activeJobs: 0,
      pending: 0,
      communicating: 0,
      hired: 0,
    },
    recentJobs: [],
    statsLoading: false,
  },

  onLoad() {
    this.loadEmployerInfo();
    this.loadRecruitment();
  },

  onShow() {
    this.loadEmployerInfo();
    this.loadRecruitment();
  },

  async loadRecruitment() {
    this.setData({ statsLoading: true });
    let jobs = [];
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'listEmployerJobs',
        },
      });
      const data = result.result || {};
      if (data.success) {
        jobs = data.jobs || [];
      }
    } catch (e) {
      jobs = [];
    }
    const activeJobs = jobs.filter((job) => job.status !== 'closed').length;
    const pending = jobs.reduce((sum, job) => sum + (Number(job.pendingCount) || 0), 0);
    const hired = jobs.reduce((sum, job) => sum + (Number(job.hiredCount) || 0), 0);
    this.setData({
      stats: {
        activeJobs,
        pending,
        communicating: 0,
        hired,
      },
      recentJobs: jobs.slice(0, 3),
      statsLoading: false,
    });
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
