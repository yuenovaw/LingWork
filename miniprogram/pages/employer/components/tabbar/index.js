Component({
  properties: {
    current: {
      type: String,
      value: "home"
    }
  },

  data: {
    tabs: [
      { key: "home", label: "首页", icon: "首" },
      { key: "jobs", label: "职位", icon: "职" },
      { key: "publish", label: "发布", icon: "+" },
      { key: "messages", label: "消息", icon: "信" },
      { key: "profile", label: "我的", icon: "我" }
    ]
  },

  methods: {
    onTabTap(e) {
      const { key } = e.currentTarget.dataset;
      if (key === this.properties.current) return;
      wx.redirectTo({
        url: `/pages/employer/${key}/index`
      });
    }
  }
});
