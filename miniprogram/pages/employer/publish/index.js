// 发布页
Page({
  data: {
    selectedOption: 'ai', // 默认选中 AI 帮发布
  },

  onAiPublish() {
    this.setData({ selectedOption: 'ai' });
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/employer/ai-chat/index',
      });
    }, 150);
  },

  onManualPublish() {
    this.setData({ selectedOption: 'manual' });
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/employer/publish-form/index',
      });
    }, 150);
  },
});
