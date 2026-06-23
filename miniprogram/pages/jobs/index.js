const { jobs } = require("../../utils/mockData");

Page({
  data: {
    city: "南京",
    displayName: "您好",
    role: "worker",
    profileReady: false,
    keyword: "",
    categories: ["附近工作", "今日急招", "日结工作", "轻松活", "包吃住", "不限经验"],
    activeCategory: "附近工作",
    jobs
  },

  onShow() {
    const profile = wx.getStorageSync("workerProfile") || {};
    const displayName = profile.name || "您好";
    const city = profile.city || "南京";
    this.setData({
      role: wx.getStorageSync("currentRole") || "worker",
      profileReady: Boolean(profile.name || profile.expectedJobs),
      displayName,
      city
    });
  },

  switchRole() {
    wx.showActionSheet({
      itemList: ["我是找工者", "我是雇主"],
      success: (res) => {
        const role = res.tapIndex === 0 ? "worker" : "employer";
        wx.setStorageSync("currentRole", role);
        this.setData({ role });
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      keyword,
      jobs: this.filterJobs(keyword, this.data.activeCategory)
    });
  },

  onCategoryTap(e) {
    const activeCategory = e.currentTarget.dataset.name;
    this.setData({
      activeCategory,
      jobs: this.filterJobs(this.data.keyword, activeCategory)
    });
  },

  filterJobs(keyword, category) {
    return jobs.filter((job) => {
      const matchKeyword = !keyword || job.title.includes(keyword) || job.category.includes(keyword) || job.location.includes(keyword);
      if (!matchKeyword) return false;
      if (category === "今日急招") return job.urgent;
      if (category === "日结工作") return job.benefits.includes("可日结");
      if (category === "轻松活") return job.benefits.includes("活轻松") || job.benefits.includes("坐班");
      if (category === "包吃住") return job.benefits.some((item) => item.includes("包"));
      if (category === "不限经验") return job.benefits.includes("不限经验");
      return true;
    });
  },

  goDetail(e) {
    wx.navigateTo({
      url: `/pages/job-detail/index?id=${e.currentTarget.dataset.id}`
    });
  },

  backToWorker() {
    wx.setStorageSync("currentRole", "worker");
    this.setData({ role: "worker" });
  },

  startAiOnboarding() {
    wx.navigateTo({
      url: "/pages/ai-onboarding/index"
    });
  }
});
