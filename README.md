# LingWork 找龄工

LingWork 是一个面向银龄人群的微信小程序项目，目标是让中老年求职者可以用更简单、更熟悉的方式登记资料、浏览岗位，并让雇主高效发布和管理适合的岗位。

项目当前包含找工端、雇主端、AI 语音登记流程和微信云开发云函数示例。

## Features

- 老年友好的找工端：首页、岗位列表、岗位详情、申请记录、个人中心
- 雇主端工作台：岗位发布、岗位管理、候选人查看、消息、企业资料
- AI 语音登记：像打电话一样收集称呼、年龄、地区、岗位偏好、时间和经验
- 自绘 AI 动态球体：canvas 实现玻璃球、内部流光和七色流动光圈
- 云函数能力：DeepSeek 资料整理、腾讯云 ASR 语音识别、腾讯云 TTS 语音播报
- 本地兜底逻辑：未配置 AI 服务时仍可通过规则生成基础资料摘要
- 协议与隐私页面：包含用户协议、服务协议、隐私政策等展示页面

## Tech Stack

- 微信小程序原生框架：WXML / WXSS / JavaScript
- 微信云开发 CloudBase
- 云函数：Node.js
- AI 接入：DeepSeek API
- 语音能力：腾讯云 ASR / TTS

## Project Structure

```text
.
├── miniprogram/                         # 小程序前端
│   ├── pages/                           # 找工端、雇主端、AI 登记等页面
│   ├── components/                      # 公共组件
│   ├── images/                          # 图片与图标资源
│   ├── styles/                          # 全局样式
│   └── utils/                           # 请求、校验、mock 数据、AI 资料整理逻辑
├── cloudfunctions/
│   └── quickstartFunctions/             # 云函数入口与 AI/语音能力封装
├── i18n/                                # 基础文案
├── project.config.json                  # 微信开发者工具项目配置
├── project.miniapp.json                 # 小程序项目配置
└── README.md
```

## Getting Started

1. 使用微信开发者工具导入本项目目录。
2. 在微信开发者工具中确认 `project.config.json` 里的 `appid` 是否需要替换为你自己的小程序 AppID。
3. 开通微信云开发，并在 `miniprogram/envList.js` 中配置云环境 ID。
4. 部署 `cloudfunctions/quickstartFunctions` 云函数。
5. 如需启用 AI 资料整理和语音能力，在云函数环境变量中配置对应密钥。

## Cloud Database

云函数会使用以下集合：

- `employer_jobs`：雇主发布的岗位。记录会带当前用户 `openid`，雇主端只读取和更新自己的岗位；找工端读取公开招聘中的岗位。
- `applications`：求职者报名记录。求职端读取自己的报名进度，雇主端读取投递到自己岗位的候选人；双方都同意后才展示联系电话。
- `user_phone_authorizations`：手机号授权或手动登记记录。

## Environment Variables

请在微信云开发控制台的云函数环境变量里配置，不要把真实密钥写入代码仓库。

```text
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
TENCENT_SECRET_ID=your_tencent_secret_id
TENCENT_SECRET_KEY=your_tencent_secret_key
TENCENT_ASR_ENGINE=16k_zh_dialect
TENCENT_TTS_VOICE_TYPE=1001
TENCENT_TTS_SPEED=-0.2
TENCENT_TTS_VOLUME=2
```

项目也提供了 `.env.example` 作为配置参考。

## Development Notes

- `project.private.config.json` 是本机微信开发者工具私有配置，默认不提交。
- 真实 API Key、Secret、Token 等请只放在云开发环境变量中。
- `miniprogram/images/ai-orb/*.gif` 为本地视觉实验产物，页面当前使用 canvas 自绘动画，不依赖 GIF 或视频素材。

## License

This project is currently published for portfolio and learning purposes. Add a license before using it in production or distributing derivative work.
