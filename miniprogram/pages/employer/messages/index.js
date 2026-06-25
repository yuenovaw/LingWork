// 消息页
const { STATUS_TEXT } = require('../../../utils/constants');

Page({
  data: {
    activeTab: 'pending',
    tabs: [
      { key: 'pending', label: STATUS_TEXT.application.pending },
      { key: 'communicating', label: STATUS_TEXT.application.communicating },
      { key: 'hired', label: STATUS_TEXT.application.hired },
      { key: 'rejected', label: STATUS_TEXT.application.rejected },
    ],
    candidates: [],
    filteredCandidates: [],
    loading: false,
  },

  onLoad(options) {
    // 如果从其他页面跳转过来，切换到对应tab
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    this.loadCandidates();
  },

  onShow() {
    this.loadCandidates();
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

  async loadCandidates() {
    this.setData({ loading: true });
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listEmployerApplications"
        }
      });
      const data = result.result || {};
      const candidates = data.success ? this.mapApplications(data.applications || []) : [];
      this.setData({ candidates });
      this.filterCandidates(this.data.activeTab);
      if (!data.success && data.errorMessage) {
        wx.showToast({ title: data.errorMessage, icon: "none" });
      }
    } catch (e) {
      this.setData({ candidates: [], filteredCandidates: [] });
      wx.showToast({ title: "候选人读取失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  mapApplications(applications) {
    return applications.map((item) => {
      const status = item.status === "waiting" || item.status === "matched" ? "pending" : item.status;
      return Object.assign({}, item, {
        status,
        name: item.workerName || "求职者",
        age: item.workerAge || "",
        time: this.formatCreatedAt(item.createdAt),
        summary: item.resumeText || `${item.expectedJobs || "想找合适的工作"}，${item.availableTime || "时间可沟通"}`
      });
    });
  },

  formatCreatedAt(value) {
    if (!value) return "刚刚报名";
    if (typeof value === "string") return value;
    const dateValue = value.$date || value;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "刚刚报名";
    return `${date.getMonth() + 1}月${date.getDate()}日报名`;
  },

  onCandidateTap(e) {
    const { id } = e.currentTarget.dataset;
    const candidate = this.data.candidates.find((item) => item.id === id);
    if (candidate) {
      wx.setStorageSync("selectedCandidateApplication", candidate);
    }
    wx.navigateTo({
      url: `/pages/employer/candidate-detail/index?id=${id}&status=${this.data.activeTab}`,
    });
  },

  // 供详情页调用的方法，更新候选人状态
  async updateCandidateStatus(candidateId, newStatus, localOnly = false) {
    if (!localOnly) {
      try {
        await wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: {
            type: "updateApplicationStatus",
            id: candidateId,
            status: newStatus
          }
        });
      } catch (e) {
        wx.showToast({ title: "状态更新失败", icon: "none" });
        return;
      }
    }
    const { candidates } = this.data;
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    this.setData({ candidates: updatedCandidates });

    this.filterCandidates(this.data.activeTab);
  },
});
