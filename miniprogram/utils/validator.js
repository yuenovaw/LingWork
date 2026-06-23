/**
 * 表单验证工具
 */

/**
 * 手机号验证
 */
function isPhoneNumber(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 必填验证
 */
function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * 验证雇主资料
 */
function validateEmployerProfile(data) {
  const errors = [];

  if (!isRequired(data.name)) {
    errors.push('请输入雇主称呼');
  }

  if (!isRequired(data.type)) {
    errors.push('请选择雇主类型');
  }

  if (!isRequired(data.city)) {
    errors.push('请选择所在城市');
  }

  if (!isRequired(data.phone)) {
    errors.push('请输入联系电话');
  } else if (!isPhoneNumber(data.phone)) {
    errors.push('请输入正确的手机号');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证岗位信息
 */
function validateJobInfo(data) {
  const errors = [];

  if (!isRequired(data.title)) {
    errors.push('请输入岗位名称');
  }

  if (!isRequired(data.salary)) {
    errors.push('请输入薪资待遇');
  }

  if (!isRequired(data.location)) {
    errors.push('请输入工作地点');
  }

  if (!isRequired(data.workTime)) {
    errors.push('请输入工作时间');
  }

  if (!isRequired(data.recruitCount)) {
    errors.push('请输入招聘人数');
  } else if (data.recruitCount <= 0) {
    errors.push('招聘人数必须大于0');
  }

  if (!isRequired(data.requirements)) {
    errors.push('请输入岗位要求');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  isPhoneNumber,
  isRequired,
  validateEmployerProfile,
  validateJobInfo,
};
