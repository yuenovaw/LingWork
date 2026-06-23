// 职位页
Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'active', label: '招聘中' },
      { key: 'closed', label: '已关闭' },
    ],
    jobs: [
      {
        id: '1',
        title: '养老院护工',
        salary: '160元/天',
        location: '南京鼓楼区湖南路',
        workTime: '8:00-18:00 周一至周五',
        recruitCount: 2,
        hiredCount: 0,
        requirements: '身体健康，有照护经验',
        status: 'active',
        pendingCount: 3,
      },
      {
        id: '2',
        title: '保洁阿姨',
        salary: '120元/天',
        location: '南京栖霞区仙林',
        workTime: '9:00-17:00',
        recruitCount: 1,
        hiredCount: 0,
        requirements: '认真负责，有保洁经验',
        status: 'active',
        pendingCount: 0,
      },
    ],
    filteredJobs: [],
  },

  onLoad() {
    this.filterJobs('all');
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
    // TODO: 打开岗位详情或编辑
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
          // 更新状态
          const jobs = this.data.jobs.map(job => 
            job.id === id ? { ...job, status: 'closed' } : job
          );
          this.setData({ jobs });
          this.filterJobs(this.data.activeTab);
          wx.showToast({ title: '已关闭', icon: 'success' });
        }
      },
    });
    e.stopPropagation();
  },

  onRestoreJob(e) {
    const { id } = e.currentTarget.dataset;
    const jobs = this.data.jobs.map(job => 
      job.id === id ? { ...job, status: 'active' } : job
    );
    this.setData({ jobs });
    this.filterJobs(this.data.activeTab);
    wx.showToast({ title: '已恢复招聘', icon: 'success' });
    e.stopPropagation();
  },
});
