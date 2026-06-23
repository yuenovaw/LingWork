/**
 * 常量定义
 */

/**
 * 用户身份类型
 */
const USER_ROLE = {
  SEEKER: 'seeker',
  EMPLOYER: 'employer',
};

/**
 * 雇主类型
 */
const EMPLOYER_TYPE = {
  PERSONAL: 'personal',
  FAMILY: 'family',
  SHOP: 'shop',
  ORGANIZATION: 'organization',
};

/**
 * 岗位状态
 */
const JOB_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
};

/**
 * 候选人申请状态
 */
const APPLICATION_STATUS = {
  PENDING: 'pending',
  COMMUNICATING: 'communicating',
  HIRED: 'hired',
  REJECTED: 'rejected',
};

/**
 * 状态显示文案映射
 */
const STATUS_TEXT = {
  job: {
    active: '招聘中',
    closed: '已关闭',
  },
  application: {
    pending: '待处理',
    communicating: '沟通中',
    hired: '已录用',
    rejected: '暂不合适',
  },
};

/**
 * 雇主类型文案
 */
const EMPLOYER_TYPE_TEXT = {
  personal: '个人',
  family: '家庭',
  shop: '小店',
  organization: '机构',
};

module.exports = {
  USER_ROLE,
  EMPLOYER_TYPE,
  JOB_STATUS,
  APPLICATION_STATUS,
  STATUS_TEXT,
  EMPLOYER_TYPE_TEXT,
};
