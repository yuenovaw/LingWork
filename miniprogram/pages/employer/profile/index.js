// 我的页
Page({
  data: {
    employerInfo: {
      avatar: 'male', // male 或 female
      name: '张老板',
      type: '个人',
      city: '南京',
      phone: '138****8888',
      verified: true,
    },
    avatarText: '张',
  },

  onLoad() {
    this.loadEmployerInfo();
  },

  onShow() {
    // 每次显示页面时重新加载，以便显示更新后的信息
    this.loadEmployerInfo();
  },

  loadEmployerInfo() {
    // 从存储中获取雇主数据
    const employerData = wx.getStorageSync('employerData') || wx.getStorageSync('tempEmployerData');
    if (!employerData) {
      const avatarText = this.data.employerInfo.name.slice(0, 1);
      if (this.data.avatarText !== avatarText || this.data.employerInfo.verified !== false) {
        this.setData({
          avatarText,
          'employerInfo.verified': false,
        });
      }
      return;
    }

    const nextInfo = {
      ...this.data.employerInfo,
      avatar: employerData.avatar || 'male',
      name: employerData.name || '雇主',
      type: employerData.type || '个人',
      city: employerData.city || '',
      phone: employerData.phone || '',
      verified: employerData.verified || false,
    };
    const nextAvatarText = nextInfo.name.slice(0, 1);
    const current = this.data.employerInfo;
    if (
      nextInfo.name !== current.name ||
      nextInfo.type !== current.type ||
      nextInfo.city !== current.city ||
      nextInfo.phone !== current.phone ||
      nextInfo.verified !== current.verified ||
      nextAvatarText !== this.data.avatarText
    ) {
      this.setData({
        employerInfo: nextInfo,
        avatarText: nextAvatarText,
      });
    }
  },

  // 编辑个人资料
  onProfileEdit() {
    wx.showModal({
      title: '雇主资料',
      content: `${this.data.employerInfo.name}｜${this.data.employerInfo.type}｜${this.data.employerInfo.city || '未填写城市'}`,
      confirmText: '知道了',
      showCancel: false,
    });
  },

  // 认证状态
  onVerifyTap() {
    wx.showModal({
      title: this.data.employerInfo.verified ? '已认证' : '认证说明',
      content: this.data.employerInfo.verified ? '当前雇主资料已通过演示认证。' : '正式上线后，这里会接入营业执照、实名信息或人工审核。',
      confirmText: '知道了',
      showCancel: false,
    });
  },

  onSwitchToWorker() {
    wx.setStorageSync('currentRole', 'worker');
    wx.switchTab({
      url: '/pages/jobs/index',
    });
  },

  // 菜单项点击
  onMenuItemTap(e) {
    const { action } = e.currentTarget.dataset;
    const actions = {
      company: {
        title: '企业信息',
        content: `${this.data.employerInfo.name}｜${this.data.employerInfo.type}｜${this.data.employerInfo.phone}`
      },
      security: {
        title: '账户安全',
        content: '当前为路演版本，手机号和联系信息仅用于演示。正式版会接入实名校验和权限保护。'
      },
      feedback: {
        title: '意见反馈',
        content: '可以先把问题记录给项目成员，正式版会接入客服和反馈表。'
      },
      about: {
        title: '关于找龄工',
        content: '找龄工帮助中老年人安心找零工，也帮助雇主更快找到合适人选。'
      },
      settings: {
        title: '设置',
        content: '当前版本已精简设置项，保留切换身份和基础资料展示。'
      }
    };

    if (actions[action]) {
      wx.showModal({
        title: actions[action].title,
        content: actions[action].content,
        confirmText: '知道了',
        showCancel: false,
      });
    }
  },
});
