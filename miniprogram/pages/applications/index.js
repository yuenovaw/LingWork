Page({
  data: {
    applications: [],
    loading: false
  },

  async onShow() {
    await this.loadApplications();
  },

  async loadApplications() {
    this.setData({ loading: true });
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listWorkerApplications"
        }
      });
      const data = result.result || {};
      const applications = data.success ? (data.applications || []) : [];
      this.setData({
        applications: this.decorateApplications(applications)
      });
      if (!data.success && data.errorMessage) {
        wx.showToast({ title: data.errorMessage, icon: "none" });
      }
    } catch (e) {
      wx.showToast({ title: "报名读取失败", icon: "none" });
      this.setData({ applications: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  decorateApplications(applications) {
    const insuranceMap = {
      provided: {
        text: "雇主已购置日结险",
        className: "safe"
      },
      notProvided: {
        text: "暂未购置日结险",
        className: "warn"
      },
      pending: {
        text: "日结险待确认",
        className: "pending"
      }
    };
    const statusMap = {
      pending: "等待处理",
      waiting: "等待处理",
      communicating: "雇主已同意",
      hired: "已录用",
      rejected: "暂不合适",
      matched: "雇主已同意"
    };
    return applications
      .filter((item) => !String(item.id || "").startsWith("apply-demo-"))
      .map((item) => {
        const insurance = insuranceMap[item.dailyInsurance] || insuranceMap.pending;
        const canContact = Boolean(item.workerAgreed && item.employerAgreed);
        return Object.assign({}, item, {
          canContact,
          createdAtText: this.formatCreatedAt(item.createdAt),
          statusText: canContact ? "可联系" : (statusMap[item.status] || "等待处理"),
          insuranceText: insurance.text,
          insuranceClass: insurance.className
        });
      });
  },

  formatCreatedAt(value) {
    if (!value) return "刚刚";
    if (typeof value === "string") return value;
    const dateValue = value.$date || value;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "刚刚";
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/job-detail/index?id=${e.currentTarget.dataset.jobId}`
    });
  }
});
