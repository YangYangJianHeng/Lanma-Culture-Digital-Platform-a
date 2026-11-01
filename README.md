# Lanma-Culture-Digital-Platform-a
兰马文化数字化传播与互动平台
兰州马拉松文化数字化传播与互动平台，提供赛事信息、奖牌 3D 展示、赛道地标、跑者故事、美食推荐、旅游景点、天气数据、AI 助手等功能。

技术栈
层级	技术
后端框架	Spring Boot 3.2.5 + Java 21
数据库	MySQL 8.0
缓存	Redis 7
ORM	Spring Data JPA (Hibernate 6)
安全	Spring Security + JWT (Nimbus)
前端框架	React 18 + TypeScript
构建工具	Vite 5
UI 组件	Ant Design 5
3D 渲染	Three.js + React Three Fiber
状态管理	Zustand
图表	ECharts
样式	Tailwind CSS 3
项目结构
├── backend-springboot/          # Spring Boot 后端
│   ├── src/main/java/com/lanma/culture/
│   │   ├── config/              # 配置类（安全、缓存、CORS）
│   │   ├── controller/          # REST 控制器
│   │   ├── dto/                 # 数据传输对象
│   │   ├── entity/              # JPA 实体
│   │   ├── exception/           # 全局异常处理
│   │   ├── repository/          # 数据访问层
│   │   ├── security/            # JWT 认证与过滤器
│   │   └── service/             # 业务逻辑层
│   └── src/main/resources/
│       └── application.yml      # 应用配置
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── api/                 # API 请求模块
│   │   ├── components/          # 公共组件
│   │   ├── layouts/             # 布局组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── admin/           # 管理后台页面
│   │   │   ├── auth/            # 登录注册页面
│   │   │   ├── culture/         # 文化展示页面
│   │   │   ├── dashboard/       # 用户中心页面
│   │   │   ├── home/            # 首页
│   │   │   └── stories/         # 跑者故事页面
│   │   ├── router/              # 路由配置
│   │   ├── store/               # Zustand 状态
│   │   └── styles/              # 样式文件
│   └── vite.config.ts           # Vite 配置
├── database/                    # 数据库脚本
│   └── init.sql                 # 初始化建表 + 种子数据
└── images/                      # 静态图片资源
环境要求
软件	最低版本	说明
JDK	21+	后端运行环境
Maven	3.8+	后端构建
Node.js	18+	前端构建
MySQL	8.0+	主数据库
Redis	6.0+	缓存与 Token 存储
快速部署
1. 克隆项目
git clone <仓库地址>
cd Lanma_Culture_Digital_Communication_Interaction_Platform
2. 初始化数据库
登录 MySQL 执行初始化脚本：

mysql -u root -p < database/init.sql
默认数据库名 lanma_culture，默认用户名 root，密码 XXXX。如需修改，编辑 backend-springboot/src/main/resources/application.yml 中的数据库连接配置。

种子数据包含：

2 个默认角色（管理员 / 跑者）
2 个默认用户（admin / runner01，密码均为 admin123）
示例奖牌、地标、美食、旅游景点、天气、历年马拉松、小兰发布、跑者故事数据
3. 配置 Redis
确保 Redis 服务已启动，默认连接 localhost:6379，密码 XXXX。如需修改，编辑 application.yml：

spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: XXXX
4. 启动后端
cd backend-springboot
mvn clean package -DskipTests
java -jar target/lanma-culture-backend-1.0.0.jar
或开发模式直接运行：

mvn spring-boot:run
后端默认运行在 http://localhost:3000。健康检查：GET /api/health

5. 启动前端
cd frontend

# 安装依赖（仅首次）
npm install

# 开发模式
npm run dev
前端开发服务器默认运行在 http://localhost:5173，API 请求自动代理到后端 localhost:3000。

6. 生产构建
cd frontend
npm run build
构建产物在 frontend/dist/，部署到 Nginx 或其他静态服务器。生产环境需要配置反向代理将 /api、/uploads、/images 转发到后端。

Nginx 示例配置：

server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://localhost:3000;
    }

    # 图片代理
    location /images/ {
        proxy_pass http://localhost:3000;
    }
}
默认账户
角色	用户名	密码	说明
管理员	admin	admin123	后台管理全部权限
跑者	runner01	admin123	普通用户功能
管理员登录入口：/admin/login
普通用户登录入口：/login

功能模块
前台展示
模块	路径	说明
首页	/	平台入口，赛事倒计时
博物馆	/museum	3D 奖牌展示
小兰发布	/publications	官方资讯
赛道地图	/map	赛道地标地图
跑者故事	/stories	故事广场
历年赛事	/marathons	历届马拉松回顾
天气	/weather	赛事天气数据
美食推荐	/food	兰州美食指南
旅游景点	/tourism	兰州旅游攻略
AI 助手	/ai	智能问答
用户中心
功能	路径	说明
我的故事	/dashboard	管理个人故事
撰写故事	/dashboard/stories/new	发布新故事
个人资料	/dashboard/profile	修改资料密码
管理后台 (/admin)
模块	路径	说明
概览	/admin	管理后台首页
用户管理	/admin/users	用户信息编辑
角色管理	/admin/roles	用户类别/角色 CRUD
历届马拉松	/admin/marathons	赛事数据管理
奖牌管理	/admin/medals	奖牌与 3D 模型
地标管理	/admin/landmarks	赛道地标管理
故事管理	/admin/stories	跑者故事审核
天气数据	/admin/weather	天气数据管理
美食数据	/admin/foods	美食信息管理
旅游景点	/admin/tourism	景点数据管理
小兰发布	/admin/publications	官方内容发布
评论管理	/admin/comments	评论审核管理
本地大模型部署（AI 助手）
平台内置 小兰助手 AI 对话功能，基于 Ollama 本地大模型，可为用户提供兰州美食、旅游攻略、兰马赛事、黄河文化等智能问答服务。AI 助手页面路径：/ai

架构说明
浏览器 (React)  →  Spring Boot 后端 (AiController)
                        │
                        ├── Ollama 可连接 → 调用 http://localhost:11434/api/chat → 返回大模型回答
                        │
                        └── Ollama 不可连接 → 返回预设兜底回复（提示用户启动 Ollama）
1. 安装 Ollama
Windows

从 ollama.com/download 下载安装包，双击安装即可。

macOS

brew install ollama
Linux

curl -fsSL https://ollama.com/install.sh | sh
安装后启动服务：

# 启动 Ollama 服务（后台运行）
ollama serve
默认监听 http://localhost:11434。

2. 下载并运行模型
# 拉取模型（推荐 qwen3，中文能力强；或使用 llama3）
ollama pull Gemma 4 4B  //可修改模型名称

# 交互式测试
ollama run 模型名称
推荐模型：

模型	大小	特点
qwen3	~4.7 GB	通义千问 3，中文能力强，推荐首选
qwen2.5	~4.7 GB	通义千问 2.5，中文能力优秀
deepseek-r1:7b	~4.7 GB	DeepSeek 推理模型，逻辑能力强
llama3	~4.7 GB	Meta Llama 3，通用能力强
验证模型已加载：

ollama list
# 输出示例：
# NAME              ID              SIZE      MODIFIED
# qwen3:latest      abc123def456    4.7 GB    2 days ago
3. 配置模型
后端默认使用 llama3 模型。如需更换，有两种方式：

方式一：前端请求时指定（推荐）

前端调用 /api/v1/ai/chat 时传入 model 字段：

{
  "message": "兰州有什么好吃的？",
  "model": "qwen3"
}
方式二：修改后端默认模型

编辑 AiController.java:32，将 llama3 改为你的模型名：

String model = (String) body.getOrDefault("model", "qwen3");  // 改为 qwen3
4. 验证 AI 对话
确保 Ollama 服务已启动且模型已加载
启动 Spring Boot 后端
启动前端，访问 http://localhost:5173/ai
输入问题如"兰州有什么好吃的？"
如果 Ollama 正常运行，Tag 会显示 🦙 Ollama 绿色标签，表示回答来自本地大模型。如果 Ollama 未启动，Tag 会显示 💡 预设回复，表示使用的是兜底回复。

5. 调用流程
用户输入"兰州美食推荐"
  → POST /api/v1/ai/chat  { "message": "兰州美食推荐", "model": "qwen3" }
  → 后端保存用户消息到 ai_conversations 表
  → 后端 POST http://localhost:11434/api/chat
       { "model": "qwen3", "messages": [{"role": "user", "content": "兰州美食推荐"}], "stream": false }
  → Ollama 返回 { "message": { "content": "兰州以牛肉面闻名..." } }
  → 后端保存 AI 回复到 ai_conversations 表
  → 返回前端 { "reply": "兰州以牛肉面闻名...", "source": "ollama:qwen3" }
6. 对话历史
对话记录持久化在 ai_conversations 表中，可通过 API 查询：

# 获取当前用户对话历史
curl http://localhost:3000/api/v1/ai/history -H "X-User-Id: 1"
7. 常见问题
问题	解决方案
提示"未连接本地大模型"	检查 ollama serve 是否已启动，ollama list 确认模型已加载
返回超时或异常	首次加载模型需 10-30 秒预热，再次发送即可正常
中文回答质量差	推荐使用 qwen3 或 deepseek-r1:7b，中文能力显著优于 llama3
显存不足	使用更小的模型：qwen3:1.8b、llama3.2:1b
非流式返回体验	当前为同步调用（stream: false），响应时间取决于模型推理速度，通常 3-15 秒
角色体系
系统内置两种角色（可在管理后台扩展）：

角色标识	显示名称	权限
admin	管理员	访问管理后台，全部数据管理
runner	跑者	发布故事、评论互动、个人中心
管理员可在 /admin/roles 中创建自定义角色，在 /admin/users 中为用户分配角色。

配置说明
核心配置集中在 backend-springboot/src/main/resources/application.yml：

server:
  port: 3000                          # 后端端口

spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/lanma_culture?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root                    # 数据库用户名
    password: XXXX                   # 数据库密码

  jpa:
    hibernate:
      ddl-auto: update                # 自动更新表结构

  data:
    redis:
      host: localhost                 # Redis 地址
      port: 6379                      # Redis 端口
      password: XXXX                 # Redis 密码

app:
  jwt:
    secret: your-secret-key           # JWT 签名密钥
    expiration-ms: 7200000            # Token 有效期（2小时）

  upload:
    dir: ./uploads                    # 上传文件存储目录
API 概览
前缀	说明	认证
/api/health	健康检查	无
/api/v1/auth/**	认证（登录/注册）	无
/api/v1/upload	文件上传	Bearer Token
/api/v1/medals/**	奖牌数据	GET 公开
/api/v1/landmarks/**	地标数据	GET 公开
/api/v1/stories/**	跑者故事	GET 公开
/api/v1/foods/**	美食数据	GET 公开
/api/v1/tourism/**	旅游数据	GET 公开
/api/v1/marathons/**	赛事数据	GET 公开
/api/v1/weather/**	天气数据	GET 公开
/api/v1/comments/**	评论数据	GET 公开
/api/v1/recommend/**	推荐数据	GET 公开
/api/v1/ai/**	AI 对话	无
/api/v1/admin/**	后台管理	ROLE_ADMIN
