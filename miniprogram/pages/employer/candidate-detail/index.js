// 候选人详情页
Page({
  data: {
    candidateId: '',
    status: 'pending', // pending, communicating, hired, rejected
    showContact: false,
    tipText: '💡 点击"匹配意向"后可查看候选人联系方式',
    candidateInfo: {
      name: '李阿姨',
      age: 56,
      jobTitle: '养老院护工',
      location: '南京鼓楼',
      availableTime: '随时',
      phone: '138****8888',
      wechat: 'wxid_xxxxx',
    },
  },

  onLoad(options) {
    const { id, status } = options;
    this.setData({
      candidateId: id,
      status: status || 'pending',
    });

    // 如果状态是沟通中或已录用，显示联系方式
    if (this.data.status === 'communicating' || this.data.status === 'hired') {
      this.setData({
        showContact: true,
        tipText: '💡 温馨提示：联系时请说明来自"找龄工"小程序',
      });
    }
  },


  // 查看完整简历
  onViewResume() {
    wx.showModal({
      title: '查看简历',
      content: '简历下载功能开发中，敬请期待',
      showCancel: false,
    });
  },

  // 匹配意向
  onMatchInterest() {
    wx.showModal({
      title: '确认匹配',
      content: '匹配后将可查看候选人的联系方式',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            status: 'communicating',
            showContact: true,
            tipText: '💡 温馨提示：联系时请说明来自"找龄工"小程序',
          });
          wx.showToast({ title: '已匹配', icon: 'success' });

          // 通知列表页更新状态
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.updateCandidateStatus) {
            prevPage.updateCandidateStatus(this.data.candidateId, 'communicating');
          }
        }
      },
    });
  },

  // 不合适
  onNotSuitable() {
    wx.showModal({
      title: '确认不合适',
      content: '标记后该候选人将进入"暂不合适"列表',
      success: (res) => {
        if (res.confirm) {
          this.setData({ status: 'rejected' });
          wx.showToast({ title: '已标记', icon: 'success' });

          // 延迟返回，让用户看到状态变化
          setTimeout(() => {
            // 通知列表页更新状态
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.updateCandidateStatus) {
              prevPage.updateCandidateStatus(this.data.candidateId, 'rejected');
            }
            wx.navigateBack();
          }, 1500);
        }
      },
    });
  },

  // 录用
  onHired() {
    wx.showModal({
      title: '确认录用',
      content: '确认录用该候选人吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ status: 'hired' });
          wx.showToast({ title: '已录用', icon: 'success' });

          // 延迟返回，让用户看到状态变化
          setTimeout(() => {
            // 通知列表页更新状态
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.updateCandidateStatus) {
              prevPage.updateCandidateStatus(this.data.candidateId, 'hired');
            }
            wx.navigateBack();
          }, 1500);
        }
      },
    });
  },

  // 复制手机号
  onCopyPhone() {
    wx.setClipboardData({
      data: this.data.candidateInfo.phone,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
    });
  },

  // 复制微信号
  onCopyWechat() {
    wx.setClipboardData({
      data: this.data.candidateInfo.wechat,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
    });
  },
});
