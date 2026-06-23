/**
 * 本地存储封装
 */

const STORAGE_PREFIX = 'zlg_';

/**
 * 设置存储
 */
function set(key, value) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, value);
    return true;
  } catch (e) {
    console.error('存储失败:', e);
    return false;
  }
}

/**
 * 获取存储
 */
function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(STORAGE_PREFIX + key);
    return value !== '' ? value : defaultValue;
  } catch (e) {
    console.error('读取失败:', e);
    return defaultValue;
  }
}

/**
 * 删除存储
 */
function remove(key) {
  try {
    wx.removeStorageSync(STORAGE_PREFIX + key);
    return true;
  } catch (e) {
    console.error('删除失败:', e);
    return false;
  }
}

/**
 * 清空所有存储
 */
function clear() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (e) {
    console.error('清空失败:', e);
    return false;
  }
}

/**
 * 用户身份相关存储
 */
const userStorage = {
  // 获取用户身份
  getUserRole: () => get('userRole'),
  // 设置用户身份
  setUserRole: (role) => set('userRole', role),
  // 是否已注册
  isRegistered: (role) => get(`${role}Registered`, false),
  // 设置已注册
  setRegistered: (role) => set(`${role}Registered`, true),
  // 获取雇主信息
  getEmployerInfo: () => get('employerInfo'),
  // 设置雇主信息
  setEmployerInfo: (info) => set('employerInfo', info),
};

module.exports = {
  set,
  get,
  remove,
  clear,
  userStorage,
};
