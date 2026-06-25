// 岗位编辑页
Page({
  data: {
    jobId: '',
    formData: {
      title: '',
      salary: '',
      location: '',
      workTime: '',
      recruitCount: 1,
      requirements: '',
      phone: '',
    },
    loading: false,
    saving: false,
  },

  async onLoad(options) {
    const { id } = options;
    if (!id) return;
    this.setData({ jobId: id, loading: true });
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'listEmployerJobs' },
      });
      const data = result.result || {};
      const jobs = data.success ? (data.jobs || []) : [];
      const job = jobs.find(j => j.id === id);
      if (job) {
        this.setData({
          formData: {
            title: job.title || '',
            salary: job.salary || '',
            location: job.location || '',
            workTime: job.workTime || '',
            recruitCount: job.recruitCount || 1,
            requirements: job.requirements || '',
            phone: job.phone || '',
          },
        });
      } else {
        wx.showToast({ title: '找不到该岗位', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onTitleInput(e) { this.setData({ 'formData.title': e.detail.value }); },
  onSalaryInput(e) { this.setData({ 'formData.salary': e.detail.value }); },
  onLocationInput(e) { this.setData({ 'formData.location': e.detail.value }); },
  onWorkTimeInput(e) { this.setData({ 'formData.workTime': e.detail.value }); },
  onCountInput(e) { this.setData({ 'formData.recruitCount': parseInt(e.detail.value) || 1 }); },
  onRequirementsInput(e) { this.setData({ 'formData.requirements': e.detail.value }); },
  onPhoneInput(e) { this.setData({ 'formData.phone': e.detail.value }); },

  async onSave() {
    const { formData, jobId, saving } = this.data;
    if (saving) return;
    if (!formData.title) return wx.showToast({ title: '请输入岗位名称', icon: 'none' });
    if (!formData.salary) return wx.showToast({ title: '请输入薪资待遇', icon: 'none' });
    if (!formData.location) return wx.showToast({ title: '请输入工作地点', icon: 'none' });
    if (!formData.workTime) return wx.showToast({ title: '请输入工作时间', icon: 'none' });
    if (!formData.requirements) return wx.showToast({ title: '请输入岗位要求', icon: 'none' });
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' });

    this.setData({ saving: true });
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'updateEmployerJob', id: jobId, job: formData },
      });
      const data = result.result || {};
      if (!data.success) {
        wx.showToast({ title: data.errorMessage || '保存失败', icon: 'none' });
        return;
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (e) {
      wx.showToast({ title: '保存失败，请检查云开发', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onCancel() {
    wx.navigateBack();
  },
});
