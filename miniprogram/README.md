# 兰马文化数字平台 · 微信小程序

这是一个独立的微信小程序客户端，复用后端 Spring Boot 服务（与 Web 端项目共享同一个后端）。

## 功能模块

| 模块 | 路径 | 功能 |
| --- | --- | --- |
| 首页 | `pages/index/index` | 赛事倒计时、模块入口、当前天气、小兰发布、个性化推荐 |
| 故事广场 | `pages/stories/stories` | 跑者故事列表、搜索、年份筛选 |
| 故事详情 | `pages/story-detail/story-detail` | 故事正文、图片预览、点赞、评论 |
| 发布故事 | `pages/story-publish/story-publish` | 富文本 + 多图上传（最多 9 张） |
| 我的故事 | `pages/my-stories/my-stories` | 我的故事列表、长按删除 |
| 奖牌博物馆 | `pages/medals/medals` | 历届奖牌网格浏览 |
| 赛道地标 | `pages/landmarks/landmarks` | 赛道沿线地标，含语音讲解 |
| 美食推荐 | `pages/foods/foods` | 分类筛选 + 详情弹层（推荐理由、AI 点评） |
| 旅游景点 | `pages/tourism/tourism` | 分类筛选 + 详情 + 一键调起地图导航 |
| 赛事天气 | `pages/weather/weather` | 当前天气、5 天预报、近 7 天历史 |
| 历届兰马 | `pages/marathons/marathons` | 时间轴样式展示历届赛事 |
| 小兰发布 | `pages/publications/publications` | 官方资讯详情阅读 |
| AI 小兰 | `pages/ai/ai` | 大模型对话，支持快速提示语 |
| 个人中心 | `pages/profile/profile` | 头像、资料、故事统计、菜单入口 |
| 编辑资料 | `pages/edit-profile/edit-profile` | 修改用户名/职业/性别/年龄/头像 |
| 修改密码 | `pages/change-password/change-password` | 改密后强制重新登录 |
| 登录/注册 | `pages/login/login`、`pages/register/register` | 用户登录注册 |

## 启动步骤

1. 用 **微信开发者工具** 打开本目录 `miniprogram/`（不是项目根目录）。
2. 确认 `project.config.json` 里的 `appid`（默认 `touristappid` 是游客模式，可用真机调试）。要发布请到 [微信公众平台](https://mp.weixin.qq.com/) 注册并修改为自己的 AppID。
3. 确认后端服务已启动：
   - 后端根目录：`backend-springboot/`
   - 启动命令（IDE 或 `mvn spring-boot:run`）默认端口 `8080`
4. 在小程序端配置后端地址：
   - 打开 `miniprogram/app.js`
   - 修改 `globalData.apiBase` 为实际后端地址：
     - 微信开发者工具本地调试：`http://localhost:8080`
     - 真机预览：使用电脑在同局域网内的 IP，例如 `http://192.168.1.10:8080`
5. 在 **微信开发者工具** 里勾选「详情 → 本地设置 → 不校验合法域名」（开发阶段），否则会被 HTTPS 限制。
6. 编译运行即可。

### 测试账号

- 管理员：`admin / admin123`
- 普通用户：`runner01 / admin123`
> 实际账号以你初始化数据库后的为准。

## 目录结构

```
miniprogram/
├── app.js               # 应用入口（全局配置、token 校验）
├── app.json             # 路由、tabBar、全局样式
├── app.wxss             # 全局样式（按钮、卡片、标签、空状态等）
├── sitemap.json         # 微信搜索 sitemap
├── project.config.json  # 微信开发者工具工程配置
├── project.private.config.json
├── utils/
│   ├── api.js           # 统一请求封装（wx.request + token 注入 + 错误处理）
│   ├── auth.js          # Token / 用户缓存 + 登录/注册/登出包装
│   └── util.js          # 通用工具（时间格式化、分页、防抖等）
├── images/              # tabbar 占位图标
└── pages/               # 全部页面（共 17 个目录）
```

## 与后端 API 的对应关系

| 前端功能 | 后端接口 |
| --- | --- |
| 登录 | `POST /api/v1/auth/login` |
| 注册 | `POST /api/v1/auth/register` |
| 我的资料 | `GET /api/v1/auth/me`、`PUT /api/v1/auth/profile`、`PUT /api/v1/auth/password` |
| 退出登录 | `POST /api/v1/auth/logout` |
| 个性化推荐 | `GET /api/v1/recommend` |
| 跑者故事列表 | `GET /api/v1/stories`、`GET /api/v1/stories/my` |
| 故事点赞 | `POST /api/v1/stories/{id}/like`、`GET /api/v1/stories/{id}/like-status` |
| 评论 | `GET /api/v1/comments/{targetType}/{targetId}`、`POST /api/v1/comments` |
| 奖牌 | `GET /api/v1/medals`、`GET /api/v1/medals/{id}` |
| 地标 | `GET /api/v1/landmarks`、`GET /api/v1/landmarks/{id}` |
| 美食 | `GET /api/v1/foods`、`GET /api/v1/foods/{id}` |
| 旅游 | `GET /api/v1/tourism`、`GET /api/v1/tourism/{id}` |
| 天气 | `GET /api/v1/weather/now`、`/forecast`、`/history` |
| 历届赛事 | `GET /api/v1/marathons`、`GET /api/v1/marathons/{id}` |
| 小兰发布 | `GET /api/v1/publications`、`GET /api/v1/publications/{id}` |
| AI 对话 | `POST /api/v1/ai/chat`（请求头 `X-User-Id`）、`GET /api/v1/ai/history` |
| 文件上传 | `POST /api/v1/upload`（FormData，字段名 `file`） |

## 鉴权

- 登录成功后，`utils/auth.js` 会把 token 写入 `wx.setStorageSync('lanma_token', token)`，用户信息写入 `lanma_user`。
- 之后每一次请求都会自动注入 `Authorization: Bearer <token>` 头。
- 收到 401/403 时，自动清除登录态并提示用户重新登录。
- AI 接口还要求 `X-User-Id` 头（用于关联用户对话历史），`pages/ai/ai.js` 会从缓存里读取用户 id 并附带。

## 注意事项

1. **小程序端不包含后台管理界面**：删除按钮仅在「我的故事」里允许本人删除自己的故事；管理员端功能请使用现有的 Web 后台（`frontend/`）。
2. **图片防盗链**：后端如果做了防盗链（Referer 校验），需要在 Nginx / 网关放行 `servicewechat.com`。
3. **HTTPS**：发布到正式版小程序时，后端必须支持 HTTPS，且 `apiBase` 改为 HTTPS 域名（需在小程序后台配置「业务域名」）。
4. **TabBar 图标**：默认提供的 8 个 PNG 是 1×1 占位图，建议在 `images/` 中替换为自定义的 81×81 像素 PNG（普通态 / 选中态各一张）。

## 开发调试技巧

- `wx.showToast({ title: '...', icon: 'none' })` 用于显示错误（`utils/api.js` 中已统一）。
- 在 `pages/index/index.js` 中可以临时打印 `this.data` 来调试推荐数据。
- `project.private.config.json` 已被 git 忽略，可改 `compileHotReLoad` 等个人配置。