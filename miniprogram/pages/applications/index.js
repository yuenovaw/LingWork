const { mockApplications } = require("../../utils/mockData");

Page({
  data: {
    applications: []
  },

  onShow() {
    const applications = wx.getStorageSync("applications");
    if (!applications || !applications.length) {
      wx.setStorageSync("applications", mockApplications);
    }
    this.setData({
      applications: this.decorateApplications(wx.getStorageSync("applications") || [])
    });
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

    return applications.map((item) => {
      const insurance = insuranceMap[item.dailyInsurance] || insuranceMap.pending;
      return Object.assign({}, item, {
        insuranceText: insurance.text,
        insuranceClass: insurance.className
      });
    });
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/job-detail/index?id=${e.currentTarget.dataset.jobId}`
    });
  }
});
