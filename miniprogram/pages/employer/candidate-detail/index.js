// 候选人详情页
Page({
  data: {
    candidateId: '',
    status: 'pending', // pending, communicating, hired, rejected
    showContact: false,
    tipText: '点击"匹配意向"后可查看候选人联系方式',
    candidateTitle: '候选人',
    ageText: '未填写',
    candidateInfo: {
      name: '候选人',
      age: '',
      jobTitle: '',
      location: '',
      availableTime: '',
      phone: '',
      maskedPhone: '',
      wechat: '',
      resumeText: '',
      workerAgreed: false,
      employerAgreed: false,
    },
  },

  onLoad(options) {
    const { id, status } = options;
    const selected = wx.getStorageSync('selectedCandidateApplication') || {};
    const candidateInfo = selected.id === id ? this.mapCandidateInfo(selected) : this.data.candidateInfo;
    this.setData({
      candidateId: id,
      status: status || 'pending',
      candidateInfo,
      candidateTitle: this.buildCandidateTitle(candidateInfo),
      ageText: candidateInfo.age ? `${candidateInfo.age}岁` : '未填写',
    });

    if (this.canShowCandidateContact(candidateInfo, this.data.status)) {
      this.setData({
        showContact: true,
        tipText: '温馨提示：联系时请说明来自"找龄工"小程序',
      });
    }
  },

  mapCandidateInfo(application) {
    return {
      name: application.workerName || application.name || '候选人',
      age: application.workerAge || application.age || '',
      jobTitle: application.jobTitle || '',
      location: application.workerLocation || application.location || '',
      availableTime: application.availableTime || '时间可沟通',
      phone: application.workerPhone || '',
      maskedPhone: application.workerPhoneMasked || '',
      wechat: application.wechat || '',
      resumeText: application.resumeText || application.summary || '',
      workerAgreed: Boolean(application.workerAgreed),
      employerAgreed: Boolean(application.employerAgreed),
    };
  },

  canShowCandidateContact(candidateInfo, status) {
    const statusAllows = status === 'communicating' || status === 'hired';
    return statusAllows && candidateInfo.workerAgreed && candidateInfo.employerAgreed;
  },

  buildCandidateTitle(candidateInfo) {
    return candidateInfo.age ? `${candidateInfo.name} · ${candidateInfo.age}岁` : candidateInfo.name;
  },

  // 查看完整简历
  onViewResume() {
    wx.showModal({
      title: '查看简历',
      content: this.data.candidateInfo.resumeText || '候选人暂未填写完整简历。',
      showCancel: false,
    });
  },

  async updateCloudStatus(newStatus) {
    const result = await wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'updateApplicationStatus',
        id: this.data.candidateId,
        status: newStatus,
      },
    });
    const data = result.result || {};
    if (!data.success) {
      throw new Error(data.errorMessage || '状态更新失败');
    }
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.updateCandidateStatus) {
      prevPage.updateCandidateStatus(this.data.candidateId, newStatus, true);
    }
  },

  // 匹配意向
  onMatchInterest() {
    wx.showModal({
      title: '确认匹配',
      content: '匹配后将可查看候选人的联系方式',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '更新中' });
          this.updateCloudStatus('communicating')
            .then(() => {
              const nextCandidateInfo = Object.assign({}, this.data.candidateInfo, {
                employerAgreed: true,
              });
              const showContact = this.canShowCandidateContact(nextCandidateInfo, 'communicating');
              this.setData({
                status: 'communicating',
                candidateInfo: nextCandidateInfo,
                candidateTitle: this.buildCandidateTitle(nextCandidateInfo),
                ageText: nextCandidateInfo.age ? `${nextCandidateInfo.age}岁` : '未填写',
                showContact,
                tipText: showContact ? '温馨提示：联系时请说明来自"找龄工"小程序' : '已表达匹配意向，等待求职者同意后可查看联系方式',
              });
              wx.showToast({ title: '已匹配', icon: 'success' });
            })
            .catch((e) => wx.showToast({ title: e.message || '更新失败', icon: 'none' }))
            .finally(() => wx.hideLoading());
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
          wx.showLoading({ title: '更新中' });
          this.updateCloudStatus('rejected')
            .then(() => {
              this.setData({ status: 'rejected' });
              wx.showToast({ title: '已标记', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1200);
            })
            .catch((e) => wx.showToast({ title: e.message || '更新失败', icon: 'none' }))
            .finally(() => wx.hideLoading());
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
          wx.showLoading({ title: '更新中' });
          this.updateCloudStatus('hired')
            .then(() => {
              this.setData({ status: 'hired' });
              wx.showToast({ title: '已录用', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1200);
            })
            .catch((e) => wx.showToast({ title: e.message || '更新失败', icon: 'none' }))
            .finally(() => wx.hideLoading());
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
