function callFunction(name, data = {}, options = {}) {
  return wx.cloud.callFunction({
    name,
    data,
    ...options,
  }).then(res => res.result);
}

module.exports = {
  callFunction,
};
