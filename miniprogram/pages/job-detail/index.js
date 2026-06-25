const { jobs } = require("../../utils/mockData");

Page({
  data: {
    job: null,
    application: null,
    canShowContact: false,
    loadingApplication: false
  },

  onLoad(options) {
    const cloudJobs = wx.getStorageSync("cloudWorkerJobs") || [];
    const job = cloudJobs.find((item) => item.id === options.id) || jobs.find((item) => item.id === options.id) || jobs[0];
    this.setData({ job });
    this.refreshApplication(job.id);
  },

  onShow() {
    if (this.data.job) {
      this.refreshApplication(this.data.job.id);
    }
  },

  async refreshApplication(jobId) {
    if (!jobId) return;
    this.setData({ loadingApplication: true });
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listWorkerApplications"
        }
      });
      const data = result.result || {};
      const applications = data.success ? (data.applications || []) : [];
      const application = applications.find((item) => item.jobId === jobId) || null;
      this.setData({
        application,
        canShowContact: Boolean(application && application.workerAgreed && application.employerAgreed)
      });
    } catch (e) {
      this.setData({
        application: null,
        canShowContact: false
      });
    } finally {
      this.setData({ loadingApplication: false });
    }
  },

  applyJob() {
    const { job } = this.data;
    if (!job.employerOpenid) {
      wx.showModal({
        title: "示例岗位",
        content: "这条是公开示例岗位，不能报名。请报名雇主新发布的岗位。",
        showCancel: false
      });
      return;
    }
    wx.showModal({
      title: "确认报名这个工作吗？",
      content: `${job.title}\n${job.salary}\n${job.location}\n\n报名后不会马上公开你的手机号。`,
      confirmText: "确认报名",
      cancelText: "再看看",
      success: async (res) => {
        if (!res.confirm) return;
        const profile = wx.getStorageSync("workerProfile") || {};
        const authorizedPhone = wx.getStorageSync("authorizedPhone") || "";
        const worker = Object.assign({}, profile, {
          phone: profile.phone || authorizedPhone,
          resumeText: profile.resumeText || ""
        });
        wx.showLoading({ title: "报名中" });
        try {
          const result = await wx.cloud.callFunction({
            name: "quickstartFunctions",
            data: {
              type: "createApplication",
              job,
              worker
            }
          });
          const data = result.result || {};
          if (!data.success) {
            wx.showToast({ title: data.errorMessage || "报名失败", icon: "none" });
            return;
          }
          await this.refreshApplication(job.id);
          wx.showToast({ title: data.existed ? "已报名" : "报名成功", icon: "success" });
        } catch (e) {
          wx.showToast({ title: "报名失败，请稍后重试", icon: "none" });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  async agreeContact() {
    const { application, job } = this.data;
    if (!application) return;
    wx.showLoading({ title: "提交中" });
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "updateApplicationAgreement",
          actor: "worker",
          id: application.id
        }
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || "提交失败", icon: "none" });
        return;
      }
      await this.refreshApplication(job.id);
      wx.showToast({ title: "已同意联系", icon: "success" });
    } catch (e) {
      wx.showToast({ title: "提交失败，请稍后重试", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  copyPhone() {
    const phone = (this.data.application && this.data.application.employerPhone) || this.data.job.contactPhone;
    wx.setClipboardData({
      data: phone,
      success: () => wx.showToast({ title: "电话已复制", icon: "success" })
    });
  }
});
