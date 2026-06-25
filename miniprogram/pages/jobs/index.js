const { jobs } = require("../../utils/mockData");
const { isLegacyDemoWorkerProfile } = require("../../utils/storage");
const { getLocation, nearestDistrict, isInNanjing } = require("../../utils/location");

function mapCloudJob(job) {
  return {
    id: job.id,
    employerOpenid: job.employerOpenid || "",
    title: job.title,
    salary: job.salary,
    location: job.location,
    distance: "雇主新发布",
    workTime: job.workTime,
    category: job.title || "岗位",
    ageRequirement: job.ageRequirement || "年龄可沟通",
    headcount: job.recruitCount || 1,
    benefits: ["雇主直招", "电话保护"],
    description: job.description || "雇主暂未填写详细说明，可报名后进一步沟通。",
    requirement: job.requirements || "要求可沟通。",
    employerName: "平台雇主",
    employerContact: "雇主",
    contactPhone: job.phone,
    wechatId: "",
    status: "open",
    urgent: false,
    source: "cloud"
  };
}

Page({
  data: {
    city: "南京",
    displayName: "您好",
    role: "worker",
    profileReady: false,
    keyword: "",
    categories: ["附近工作", "今日急招", "日结工作", "轻松活", "包吃住", "不限经验"],
    activeCategory: "附近工作",
    jobs,
    loading: false
  },

  async onShow() {
    let profile = wx.getStorageSync("workerProfile") || {};
    if (isLegacyDemoWorkerProfile(profile)) {
      wx.removeStorageSync("workerProfile");
      wx.removeStorageSync("authorizedPhone");
      wx.removeStorageSync("phoneAuthorized");
      profile = {};
    }
    const displayName = profile.name || "您好";
    const city = profile.city || "南京";
    this.setData({
      role: wx.getStorageSync("currentRole") || "worker",
      profileReady: Boolean(profile.name || profile.expectedJobs),
      displayName,
      city
    });
    this.detectLocation();
    await this.loadJobs();
  },

  async detectLocation() {
    try {
      const { lat, lng } = await getLocation();
      this.userLat = lat;
      this.userLng = lng;
      if (isInNanjing(lat, lng)) {
        const { name } = nearestDistrict(lat, lng);
        this.setData({ city: name });
      }
    } catch (e) {
      // 权限未授予或设备不支持，静默跳过
    }
  },

  async loadJobs() {
    this.setData({ loading: true });
    let allJobs = jobs;
    try {
      const result = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "listEmployerJobs",
          scope: "public"
        }
      });
      const data = result.result || {};
      if (data.success && data.jobs && data.jobs.length) {
        const cloudJobs = data.jobs
          .filter((job) => job.status !== "closed")
          .map(mapCloudJob);
        allJobs = cloudJobs.concat(jobs);
        wx.setStorageSync("cloudWorkerJobs", cloudJobs);
      } else {
        wx.setStorageSync("cloudWorkerJobs", []);
      }
    } catch (e) {
      allJobs = jobs;
    }
    this.allJobs = allJobs;
    this.setData({
      jobs: this.filterJobs(this.data.keyword, this.data.activeCategory),
      loading: false
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
    const sourceJobs = this.allJobs || jobs;
    return sourceJobs.filter((job) => {
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
