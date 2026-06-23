// AI发布聊天页
Page({
  data: {
    messages: [
      {
        role: 'ai',
        content: '您好！我是AI助手，帮您快速发布岗位信息。请问您想招什么岗位？',
      },
    ],
    inputContent: '',
    isLoading: false,
  },

  onInput(e) {
    this.setData({
      inputContent: e.detail.value,
    });
  },

  onSend() {
    const content = this.data.inputContent.trim();
    if (!content) return;

    // 添加用户消息
    const messages = [...this.data.messages, { role: 'user', content }];
    this.setData({ 
      messages, 
      inputContent: '',
      isLoading: true 
    });

    // 模拟AI回复（Demo阶段）
    setTimeout(() => {
      const aiResponse = this.getMockResponse(content);
      this.setData({
        messages: [...this.data.messages, { role: 'ai', content: aiResponse }],
        isLoading: false,
      });
    }, 1500);
  },

  getMockResponse(input) {
    // Demo阶段返回模拟回复
    if (input.includes('护工') || input.includes('保姆')) {
      return '好的，我了解到您想招聘护工相关岗位。请问：\n\n1. 工作地点在哪里？\n2. 薪资待遇是多少？\n3. 工作时间是怎样的？';
    }
    return '收到，请问您还有其他具体要求吗？比如工作地点、薪资待遇、工作时间等。';
  },

  onConfirmJob() {
    wx.showModal({
      title: '确认发布',
      content: '确认发布该岗位吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/employer/jobs/index' });
          }, 1500);
        }
      },
    });
  },
});
