// 消息页
Page({
  data: {
    activeTab: 'pending',
    tabs: [
      { key: 'pending', label: '待处理' },
      { key: 'communicating', label: '沟通中' },
      { key: 'hired', label: '已录用' },
      { key: 'rejected', label: '暂不合适' },
    ],
    candidates: [
      {
        id: '1',
        name: '李阿姨',
        age: 56,
        jobTitle: '养老院护工',
        time: '今天 10:30',
        summary: '有5年照护经验，可立即上岗',
        status: 'pending',
      },
      {
        id: '2',
        name: '王叔叔',
        age: 62,
        jobTitle: '门卫保安',
        time: '今天 09:15',
        summary: '退休保安，身体硬朗',
        status: 'pending',
      },
      {
        id: '3',
        name: '张大姐',
        age: 48,
        jobTitle: '保洁阿姨',
        time: '昨天 15:30',
        summary: '细心负责，有3年保洁经验',
        status: 'communicating',
      },
    ],
    filteredCandidates: [],
  },

  onLoad(options) {
    // 如果从其他页面跳转过来，切换到对应tab
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    this.filterCandidates(this.data.activeTab);
  },

  onShow() {
    // 每次显示页面时重新筛选，以防状态在详情页被更新
    this.filterCandidates(this.data.activeTab);
  },

  onTabTap(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key });
    this.filterCandidates(key);
  },

  filterCandidates(status) {
    const { candidates } = this.data;
    this.setData({
      filteredCandidates: candidates.filter(c => c.status === status),
    });
  },

  onCandidateTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/employer/candidate-detail/index?id=${id}&status=${this.data.activeTab}`,
    });
  },

  // 供详情页调用的方法，更新候选人状态
  updateCandidateStatus(candidateId, newStatus) {
    const { candidates } = this.data;
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    this.setData({ candidates: updatedCandidates });

    // 如果当前选中的tab还是pending，更新后需要重新筛选
    if (this.data.activeTab === 'pending') {
      this.filterCandidates('pending');
    }
  },
});
