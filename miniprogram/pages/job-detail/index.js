const { jobs, worker, mockApplications } = require("../../utils/mockData");

Page({
  data: {
    job: null,
    application: null,
    canShowContact: false
  },

  onLoad(options) {
    const job = jobs.find((item) => item.id === options.id) || jobs[0];
    this.setData({ job });
    this.refreshApplication(job.id);
  },

  onShow() {
    if (this.data.job) {
      this.refreshApplication(this.data.job.id);
    }
  },

  refreshApplication(jobId) {
    const applications = this.getApplications();
    const application = applications.find((item) => item.jobId === jobId) || null;
    this.setData({
      application,
      canShowContact: Boolean(application && application.workerAgreed && application.employerAgreed)
    });
  },

  getApplications() {
    const applications = wx.getStorageSync("applications");
    if (applications && applications.length) return applications;
    wx.setStorageSync("applications", mockApplications);
    return mockApplications;
  },

  applyJob() {
    const { job } = this.data;
    wx.showModal({
      title: "确认报名这个工作吗？",
      content: `${job.title}\n${job.salary}\n${job.location}\n\n报名后不会马上公开你的手机号。`,
      confirmText: "确认报名",
      cancelText: "再看看",
      success: (res) => {
        if (!res.confirm) return;
        const applications = this.getApplications();
        const existed = applications.find((item) => item.jobId === job.id);
        if (!existed) {
          applications.unshift({
            id: `apply-${Date.now()}`,
            jobId: job.id,
            jobTitle: job.title,
            salary: job.salary,
            location: job.location,
            workerName: worker.name,
            workerPhone: worker.phone,
            employerName: job.employerName,
            employerContact: job.employerContact,
            employerPhone: job.contactPhone,
            wechatId: job.wechatId,
            dailyInsurance: job.urgent ? "provided" : "pending",
            workerAgreed: false,
            employerAgreed: false,
            status: "waiting",
            createdAt: "刚刚"
          });
          wx.setStorageSync("applications", applications);
        }
        this.refreshApplication(job.id);
        wx.showToast({ title: "报名成功", icon: "success" });
      }
    });
  },

  agreeContact() {
    this.updateAgreement({ workerAgreed: true });
    wx.showToast({ title: "已同意联系", icon: "success" });
  },

  simulateEmployerAgree() {
    this.updateAgreement({ employerAgreed: true });
    wx.showToast({ title: "雇主已同意", icon: "success" });
  },

  updateAgreement(patch) {
    const applications = wx.getStorageSync("applications") || [];
    const next = applications.map((item) => {
      if (item.jobId !== this.data.job.id) return item;
      const merged = Object.assign({}, item, patch);
      merged.status = merged.workerAgreed && merged.employerAgreed ? "matched" : "waiting";
      return merged;
    });
    wx.setStorageSync("applications", next);
    this.refreshApplication(this.data.job.id);
  },

  copyPhone() {
    wx.setClipboardData({
      data: this.data.job.contactPhone,
      success: () => wx.showToast({ title: "电话已复制", icon: "success" })
    });
  }
});
