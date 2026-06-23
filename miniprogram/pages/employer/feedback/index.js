// 意见反馈页面
Page({
  data: {
    feedbackType: '',
    feedbackContent: '',
  },

  onTypeSelect(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ feedbackType: type });
  },

  onContentInput(e) {
    this.setData({ feedbackContent: e.detail.value });
  },

  onSubmit() {
    const { feedbackType, feedbackContent } = this.data;

    if (!feedbackType) {
      wx.showToast({ title: '请选择反馈类型', icon: 'none' });
      return;
    }

    if (!feedbackContent.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    wx.showToast({
      title: '提交成功，感谢您的反馈',
      icon: 'success',
      duration: 2000,
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  },
});
