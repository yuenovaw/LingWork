// 发布岗位表单页
Page({
  data: {
    submitting: false,
    formData: {
      title: '',
      salary: '',
      location: '',
      workTime: '',
      recruitCount: '',
      ageRequirement: '',
      requirements: '',
      description: '',
      phone: '',
    },
  },

  onLoad() {
    // 加载雇主信息，自动填充联系电话
    const employerData = wx.getStorageSync('employerData');
    const aiJobDraft = wx.getStorageSync('aiJobDraft') || {};
    if (aiJobDraft && Object.keys(aiJobDraft).length) {
      this.setData({
        formData: Object.assign({}, this.data.formData, aiJobDraft),
      });
    }
    if (employerData && employerData.phone) {
      this.setData({
        'formData.phone': employerData.phone,
      });
    }
  },

  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value,
    });
  },

  onSalaryInput(e) {
    this.setData({
      'formData.salary': e.detail.value,
    });
  },

  onLocationInput(e) {
    this.setData({
      'formData.location': e.detail.value,
    });
  },

  onWorkTimeInput(e) {
    this.setData({
      'formData.workTime': e.detail.value,
    });
  },

  onCountInput(e) {
    this.setData({
      'formData.recruitCount': e.detail.value,
    });
  },

  onAgeInput(e) {
    this.setData({
      'formData.ageRequirement': e.detail.value,
    });
  },

  onRequirementsInput(e) {
    this.setData({
      'formData.requirements': e.detail.value,
    });
  },

  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value,
    });
  },

  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value,
    });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    const { title, salary, location, workTime, recruitCount, requirements, phone } = this.data.formData;

    if (!title) {
      wx.showToast({ title: '请输入岗位名称', icon: 'none' });
      return;
    }
    if (!salary) {
      wx.showToast({ title: '请输入薪资待遇', icon: 'none' });
      return;
    }
    if (!location) {
      wx.showToast({ title: '请输入工作地点', icon: 'none' });
      return;
    }
    if (!workTime) {
      wx.showToast({ title: '请输入工作时间', icon: 'none' });
      return;
    }
    if (!recruitCount) {
      wx.showToast({ title: '请输入招聘人数', icon: 'none' });
      return;
    }
    if (!requirements) {
      wx.showToast({ title: '请输入岗位要求', icon: 'none' });
      return;
    }
    if (!phone) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'createEmployerJob',
          job: Object.assign({}, this.data.formData, {
            recruitCount,
          }),
        },
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || '发布失败', icon: 'none' });
        return;
      }
      wx.removeStorageSync('aiJobDraft');
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/employer/jobs/index' });
      }, 900);
    } catch (e) {
      wx.showToast({ title: '发布失败，请检查云开发', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
