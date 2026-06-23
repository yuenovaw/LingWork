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
    },
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({
        jobId: id,
        formData: {
          title: '养老院护工',
          salary: '160元/天',
          location: '南京鼓楼区湖南路',
          workTime: '8:00-18:00 周一至周五',
          recruitCount: 2,
          requirements: '身体健康，有照护经验',
        },
      });
    }
  },

  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value });
  },

  onSalaryInput(e) {
    this.setData({ 'formData.salary': e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ 'formData.location': e.detail.value });
  },

  onWorkTimeInput(e) {
    this.setData({ 'formData.workTime': e.detail.value });
  },

  onCountInput(e) {
    this.setData({ 'formData.recruitCount': parseInt(e.detail.value) || 1 });
  },

  onRequirementsInput(e) {
    this.setData({ 'formData.requirements': e.detail.value });
  },

  onSave() {
    const { formData } = this.data;
    
    if (!formData.title) return wx.showToast({ title: '请输入岗位名称', icon: 'none' });
    if (!formData.salary) return wx.showToast({ title: '请输入薪资待遇', icon: 'none' });
    
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  onCancel() {
    wx.navigateBack();
  },
});
