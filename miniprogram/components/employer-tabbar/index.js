/**
 * 雇主端底部导航组件
 */
Component({
  properties: {
    current: {
      type: String,
      value: 'home',
    }
  },

  data: {
    tabs: [
      { key: 'home', icon: 'home', label: '首页' },
      { key: 'jobs', icon: 'briefcase', label: '职位' },
      { key: 'publish', icon: 'plus-circle', label: '发布' },
      { key: 'messages', icon: 'message', label: '消息' },
      { key: 'profile', icon: 'user', label: '我的' },
    ],
  },

  methods: {
    onTabTap(e) {
      const { key, url } = e.currentTarget.dataset;
      if (key === this.properties.current) return;

      wx.redirectTo({ url });
    },
  },
});
