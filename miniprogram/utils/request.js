/**
 * 云函数调用封装
 */

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 传递给云函数的数据
 * @param {object} options 额外选项
 */
function callFunction(name, data = {}, options = {}) {
  return wx.cloud.callFunction({
    name,
    data,
    ...options,
  }).then(res => res.result);
}

function notImplemented(feature) {
  return Promise.reject(new Error(`${feature} 云端接口暂未接入`));
}

/**
 * 雇主端相关 API
 */
const employerApi = {
  // 创建岗位
  createJob: () => notImplemented('创建岗位'),
  // 更新岗位
  updateJob: () => notImplemented('更新岗位'),
  // 获取岗位列表
  getJobs: () => notImplemented('获取岗位列表'),
  // 关闭/恢复岗位
  setJobStatus: () => notImplemented('更新岗位状态'),

  // 获取候选人列表
  getApplications: () => notImplemented('获取候选人列表'),
  // 更新候选人状态
  updateApplicationStatus: () => notImplemented('更新候选人状态'),
  // 获取候选人详情
  getApplicationDetail: () => notImplemented('获取候选人详情'),
};

/**
 * 通用 API
 */
const commonApi = {
  // 获取用户 openid
  getOpenId: () => callFunction('quickstartFunctions', { type: 'getOpenId' }),
  // 更新用户信息
  updateUserInfo: () => notImplemented('更新用户信息'),
};

module.exports = {
  callFunction,
  employerApi,
  commonApi,
};
