// 意见反馈页面
Page({
  data: {
    feedbackType: '',
    feedbackContent: '',
    submitting: false,
  },

  onTypeSelect(e) {
    this.setData({ feedbackType: e.currentTarget.dataset.type });
  },

  onContentInput(e) {
    this.setData({ feedbackContent: e.detail.value });
  },

  async onSubmit() {
    const { feedbackType, feedbackContent, submitting } = this.data;
    if (submitting) return;
    if (!feedbackType) return wx.showToast({ title: '请选择反馈类型', icon: 'none' });
    if (!feedbackContent.trim()) return wx.showToast({ title: '请输入反馈内容', icon: 'none' });

    this.setData({ submitting: true });
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'submitFeedback', feedbackType, feedbackContent: feedbackContent.trim() },
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || '提交失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: '感谢您的反馈', icon: 'success', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000);
    } catch (e) {
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
