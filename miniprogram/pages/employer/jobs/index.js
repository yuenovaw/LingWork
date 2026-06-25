// 职位页
const { STATUS_TEXT } = require('../../../utils/constants');

Page({
  data: {
    activeTab: 'all',
    loading: false,
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'active', label: STATUS_TEXT.job.active },
      { key: 'closed', label: STATUS_TEXT.job.closed },
    ],
    jobs: [],
    filteredJobs: [],
  },

  onLoad() {
    this.loadJobs();
  },

  onShow() {
    this.loadJobs();
  },

  async loadJobs() {
    this.setData({ loading: true });
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'listEmployerJobs',
        },
      });
      const data = result.result || {};
      const jobs = data.success ? (data.jobs || []) : [];
      this.setData({ jobs });
      this.filterJobs(this.data.activeTab);
    } catch (e) {
      this.setData({ jobs: [] });
      this.filterJobs(this.data.activeTab);
      wx.showToast({ title: '岗位加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onTabTap(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key });
    this.filterJobs(key);
  },

  filterJobs(status) {
    const { jobs } = this.data;
    if (status === 'all') {
      this.setData({ filteredJobs: jobs });
    } else {
      this.setData({
        filteredJobs: jobs.filter(job => job.status === status),
      });
    }
  },

  onJobTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/employer/job-edit/index?id=${id}`,
    });
  },

  onEditJob(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/employer/job-edit/index?id=${id}`,
    });
  },

  onCloseJob(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认关闭',
      content: '关闭后求职者将看不到此岗位',
      success: (res) => {
        if (res.confirm) {
          this.updateJobStatus(id, 'closed', '已关闭');
        }
      },
    });
  },

  onRestoreJob(e) {
    const { id } = e.currentTarget.dataset;
    this.updateJobStatus(id, 'active', '已恢复招聘');
  },

  async updateJobStatus(id, status, toastTitle) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'updateEmployerJobStatus',
          id,
          status,
        },
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || '更新失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: toastTitle, icon: 'success' });
      this.loadJobs();
    } catch (e) {
      wx.showToast({ title: '更新失败，请检查云开发', icon: 'none' });
    }
  },
});
