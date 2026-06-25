Page({
  data: {
    worker: {
      gender: '',
      age: '',
      city: '',
      district: '',
      maskedPhone: '未绑定',
      realNameStatus: '未实名',
    },
    section: 'all',
    settings: {
      jobNotice: true,
      applicationNotice: true,
      contactNotice: true,
      privacyContact: true,
      familyNotice: false,
      voiceHelp: true,
    },
  },

  onLoad(options) {
    this.setData({ section: options.section || 'all' });
  },

  onShow() {
    this.loadWorkerProfile();
  },

  loadWorkerProfile() {
    const profile = wx.getStorageSync('workerProfile') || wx.getStorageSync('workerProfileDraft') || {};
    const phone = String(wx.getStorageSync('authorizedPhone') || profile.phone || '');
    const maskedPhone = /^1[3-9]\d{9}$/.test(phone)
      ? `${phone.slice(0, 3)}****${phone.slice(7)}`
      : (phone || '未绑定');
    this.setData({
      'worker.gender': profile.gender || '',
      'worker.age': profile.age || '',
      'worker.city': profile.city || '',
      'worker.district': profile.district || '',
      'worker.maskedPhone': maskedPhone,
      'worker.realNameStatus': profile.name ? '已填写姓名' : '未填写',
    });
  },

  toggleSetting(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`settings.${key}`]: e.detail.value });
  },

  tapItem(e) {
    wx.navigateTo({ url: '/pages/ai-onboarding/index' });
  },

  openAgreement(e) {
    const type = e.currentTarget.dataset.type || 'user';
    wx.navigateTo({ url: `/pages/agreement/index?preview=1&type=${type}` });
  },

  callService() {
    wx.showModal({
      title: '联系客服',
      content: '测试版本暂未接入真实客服。后续可接微信客服、电话客服或家属协助入口。',
      confirmText: '知道了',
      showCancel: false,
    });
  },
});
