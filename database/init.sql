-- ============================================================
-- 兰马文化数字化传播与互动平台 数据库初始化脚本
-- 引擎: InnoDB | 字符集: utf8mb4 | 排序规则: utf8mb4_unicode_ci
-- Spring Boot 3.2 + JPA 兼容
-- ============================================================

CREATE DATABASE IF NOT EXISTS lanma_culture
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE lanma_culture;

-- 清理旧表（开发环境重置用，按外键依赖倒序删除）
DROP TABLE IF EXISTS ai_conversations;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS tourism_spots;
DROP TABLE IF EXISTS foods;
DROP TABLE IF EXISTS publications;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS weather_data;
DROP TABLE IF EXISTS landmarks;
DROP TABLE IF EXISTS medals;
DROP TABLE IF EXISTS marathons;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_definitions;

-- -----------------------------------------------------------
-- 1. 角色定义表（用户类别管理）
-- -----------------------------------------------------------
CREATE TABLE role_definitions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  role_name     VARCHAR(30)     NOT NULL                 COMMENT '角色标识（如admin/runner/editor）',
  display_name  VARCHAR(50)     NOT NULL                 COMMENT '显示名称（如管理员/跑者/编辑）',
  description   VARCHAR(200)    DEFAULT NULL             COMMENT '角色描述',
  sort_order    INT             NOT NULL DEFAULT 0       COMMENT '排序',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色定义表';

-- -----------------------------------------------------------
-- 2. 用户表
-- -----------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  username      VARCHAR(50)     NOT NULL                 COMMENT '用户名',
  email         VARCHAR(100)    NOT NULL                 COMMENT '邮箱',
  password_hash VARCHAR(255)    NOT NULL                 COMMENT 'bcrypt 哈希密码',
  avatar_url    VARCHAR(255)    DEFAULT NULL             COMMENT '头像 URL',
  role          VARCHAR(20)     NOT NULL DEFAULT 'runner' COMMENT '角色：runner/admin',
  occupation    VARCHAR(30)     DEFAULT NULL             COMMENT '职业（学生/教师/程序员等）',
  age           INT             DEFAULT NULL             COMMENT '年龄',
  gender        VARCHAR(10)     DEFAULT NULL             COMMENT '性别（男/女/其他）',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -----------------------------------------------------------
-- 3. 奖牌表
-- -----------------------------------------------------------
CREATE TABLE medals (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  name          VARCHAR(100)    NOT NULL                 COMMENT '奖牌名称',
  year          YEAR            NOT NULL                 COMMENT '对应赛事年份',
  model_url     VARCHAR(255)    NOT NULL                 COMMENT '3D 模型 .glb 文件地址',
  thumbnail_url VARCHAR(255)    NOT NULL                 COMMENT '缩略图地址',
  description   TEXT            DEFAULT NULL             COMMENT '设计理念详情（富文本）',
  sort_order    INT             NOT NULL DEFAULT 0       COMMENT '展示排序',
  is_featured   INT             NOT NULL DEFAULT 0       COMMENT '是否首页推荐，1是0否',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖牌表';

-- -----------------------------------------------------------
-- 4. 赛道地标表
-- -----------------------------------------------------------
CREATE TABLE landmarks (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  name                VARCHAR(100)    NOT NULL                 COMMENT '地标名称',
  longitude           DECIMAL(10,7)   NOT NULL                 COMMENT '经度',
  latitude            DECIMAL(10,7)   NOT NULL                 COMMENT '纬度',
  category            VARCHAR(50)     NOT NULL                 COMMENT '类别：桥梁/雕塑/公园/历史建筑/自然景观',
  cover_image         VARCHAR(255)    NOT NULL                 COMMENT '封面图 URL',
  content             TEXT            DEFAULT NULL             COMMENT '文化介绍（支持 HTML）',
  video_url           VARCHAR(255)    DEFAULT NULL             COMMENT '关联视频链接',
  audio_url           VARCHAR(255)    DEFAULT NULL             COMMENT '语音讲解链接',
  distance_from_start DECIMAL(6,2)    DEFAULT NULL             COMMENT '距离赛道起点公里数',
  sort_order          INT             NOT NULL DEFAULT 0       COMMENT '展示排序',
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='赛道地标表';

-- -----------------------------------------------------------
-- 5. 跑者故事表
-- -----------------------------------------------------------
CREATE TABLE stories (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  user_id     BIGINT UNSIGNED NOT NULL                 COMMENT '外键，关联 users.id',
  race_year   YEAR            NOT NULL                 COMMENT '参赛年份',
  bib_number  VARCHAR(20)     DEFAULT NULL             COMMENT '参赛号码',
  finish_time VARCHAR(20)     DEFAULT NULL             COMMENT '完赛成绩，如"4:32:10"',
  title       VARCHAR(100)    NOT NULL                 COMMENT '故事标题',
  content     TEXT            NOT NULL                 COMMENT '故事正文（富文本）',
  images      TEXT            DEFAULT NULL             COMMENT '图片 URL 数组 JSON，如["url1","url2"]',
  is_public   INT             NOT NULL DEFAULT 1       COMMENT '1公开，0仅自己可见',
  likes_count INT UNSIGNED    NOT NULL DEFAULT 0       COMMENT '点赞数',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at),
  CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='跑者故事表';

-- -----------------------------------------------------------
-- 6. 天气数据表
-- -----------------------------------------------------------
CREATE TABLE weather_data (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  location          VARCHAR(50)     NOT NULL                 COMMENT '城市/地区',
  record_time       DATETIME        NOT NULL                 COMMENT '数据时间',
  temperature         DECIMAL(5,1)  DEFAULT NULL             COMMENT '温度(°C)',
  feels_like          DECIMAL(5,1)  DEFAULT NULL             COMMENT '体感温度(°C)',
  temp_min            DECIMAL(5,1)  DEFAULT NULL             COMMENT '最低温度(°C)',
  temp_max            DECIMAL(5,1)  DEFAULT NULL             COMMENT '最高温度(°C)',
  humidity          INT             DEFAULT NULL             COMMENT '湿度(%)',
  pressure          INT             DEFAULT NULL             COMMENT '气压(hPa)',
  wind_speed          DECIMAL(5,1)  DEFAULT NULL             COMMENT '风速(m/s)',
  wind_direction    VARCHAR(20)     DEFAULT NULL             COMMENT '风向',
  weather_condition VARCHAR(50)     DEFAULT NULL             COMMENT '天气状况(晴/多云/雨等)',
  weather_code      INT             DEFAULT NULL             COMMENT '天气代码',
  precipitation       DECIMAL(6,1)  DEFAULT NULL             COMMENT '降水量(mm)',
  visibility          DECIMAL(5,1)  DEFAULT NULL             COMMENT '能见度(km)',
  uv_index          INT             DEFAULT NULL             COMMENT '紫外线指数',
  air_quality       INT             DEFAULT NULL             COMMENT '空气质量指数',
  forecast_type     VARCHAR(20)     DEFAULT 'current'        COMMENT '数据类型(current/hourly/daily)',
  source            VARCHAR(100)    NOT NULL                 COMMENT '数据来源',
  ai_analysis       TEXT            DEFAULT NULL             COMMENT 'AI分析结果（预留LangChain）',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录入库时间',
  PRIMARY KEY (id),
  KEY idx_location_time (location, record_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='天气数据表';

-- -----------------------------------------------------------
-- 7. 点赞表
-- -----------------------------------------------------------
CREATE TABLE likes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  user_id     BIGINT UNSIGNED NOT NULL                 COMMENT '点赞用户',
  story_id    BIGINT UNSIGNED NOT NULL                 COMMENT '被点赞故事',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_story (user_id, story_id),
  KEY idx_story_id (story_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- -----------------------------------------------------------
-- 8. 历年马拉松介绍表
-- -----------------------------------------------------------
CREATE TABLE marathons (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  year              YEAR            NOT NULL                 COMMENT '赛事年份',
  name              VARCHAR(100)    NOT NULL                 COMMENT '赛事名称',
  date              DATE            DEFAULT NULL             COMMENT '举办日期',
  location          VARCHAR(100)    DEFAULT NULL             COMMENT '举办地点',
  slogan            VARCHAR(200)    DEFAULT NULL             COMMENT '赛事口号',
  description       TEXT            DEFAULT NULL             COMMENT '赛事介绍（富文本）',
  images            TEXT            DEFAULT NULL             COMMENT '图片 URL 数组 JSON',
  participant_count INT             DEFAULT NULL             COMMENT '参赛人数',
  sort_order        INT             NOT NULL DEFAULT 0       COMMENT '排序',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='历年马拉松介绍表';

-- -----------------------------------------------------------
-- 9. 美食推荐表
-- -----------------------------------------------------------
CREATE TABLE foods (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  name              VARCHAR(100)    NOT NULL                 COMMENT '美食名称',
  category          VARCHAR(50)     DEFAULT NULL             COMMENT '分类(面食/小吃/正餐/饮品/特产)',
  description       TEXT            DEFAULT NULL             COMMENT '描述',
  image_url         VARCHAR(500)    DEFAULT NULL             COMMENT '图片URL',
  address           VARCHAR(200)    DEFAULT NULL             COMMENT '地址',
  rating            DECIMAL(2,1)    DEFAULT NULL             COMMENT '评分',
  recommend         VARCHAR(200)    DEFAULT NULL             COMMENT '推荐语',
  ai_analysis       TEXT            DEFAULT NULL             COMMENT 'AI分析（预留LangChain）',
  sort_order        INT             NOT NULL DEFAULT 0       COMMENT '排序',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='美食推荐表';

-- -----------------------------------------------------------
-- 10. 旅游景点表
-- -----------------------------------------------------------
CREATE TABLE tourism_spots (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  name              VARCHAR(100)    NOT NULL                 COMMENT '景点名称',
  category          VARCHAR(50)     DEFAULT NULL             COMMENT '分类(自然景观/历史文化/公园/博物馆/地标建筑)',
  description       TEXT            DEFAULT NULL             COMMENT '描述',
  image_url         VARCHAR(500)    DEFAULT NULL             COMMENT '图片URL',
  address           VARCHAR(200)    DEFAULT NULL             COMMENT '地址',
  rating            DECIMAL(2,1)    DEFAULT NULL             COMMENT '评分',
  latitude          DECIMAL(9,6)    DEFAULT NULL             COMMENT '纬度',
  longitude         DECIMAL(9,6)    DEFAULT NULL             COMMENT '经度',
  ai_analysis       TEXT            DEFAULT NULL             COMMENT 'AI分析（预留LangChain）',
  sort_order        INT             NOT NULL DEFAULT 0       COMMENT '排序',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅游景点表';

-- -----------------------------------------------------------
-- 11. 小兰发布表
-- -----------------------------------------------------------
CREATE TABLE publications (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  title         VARCHAR(200)    NOT NULL                 COMMENT '标题',
  summary       TEXT            DEFAULT NULL             COMMENT '摘要',
  cover_image   VARCHAR(500)    DEFAULT NULL             COMMENT '封面图 URL',
  content       TEXT            DEFAULT NULL             COMMENT '内容（富文本 HTML，支持图文混排）',
  sort_order    INT             NOT NULL DEFAULT 0       COMMENT '排序',
  is_published  INT             NOT NULL DEFAULT 1       COMMENT '1发布，0草稿',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小兰发布表';

-- -----------------------------------------------------------
-- 12. AI 对话记录表
-- -----------------------------------------------------------
CREATE TABLE ai_conversations (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  user_id           BIGINT UNSIGNED DEFAULT NULL             COMMENT '用户ID',
  role              VARCHAR(20)     NOT NULL                 COMMENT '角色(user/assistant)',
  content           TEXT            NOT NULL                 COMMENT '消息内容',
  source            VARCHAR(50)     DEFAULT NULL             COMMENT '消息来源(ollama/fallback/langchain)',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话记录表';

-- -----------------------------------------------------------
-- 13. 评论表
-- -----------------------------------------------------------
CREATE TABLE comments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT  COMMENT '主键',
  user_id           BIGINT UNSIGNED NOT NULL                 COMMENT '用户ID',
  target_type       VARCHAR(20)     NOT NULL                 COMMENT '评论目标类型(food/tourism)',
  target_id         BIGINT UNSIGNED NOT NULL                 COMMENT '评论目标ID',
  content           TEXT            NOT NULL                 COMMENT '评论内容',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_target (target_type, target_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================================
-- 种子数据
-- ============================================================

-- 角色定义
INSERT INTO role_definitions (role_name, display_name, description, sort_order) VALUES
('admin', '管理员', '拥有系统全部管理权限', 1),
('runner', '跑者', '普通用户，可发布故事、评论', 2);

-- 管理员账户（密码: admin123）
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@lanma.cn', '$2a$10$hGfa3koSsnrW33AEuEIQX.VyDsUixLRSwi4OhcMuyubkXSDtWfvV2', 'admin');

-- 测试跑者
INSERT INTO users (username, email, password_hash, role) VALUES
('runner01', 'runner@test.com', '$2a$10$hGfa3koSsnrW33AEuEIQX.VyDsUixLRSwi4OhcMuyubkXSDtWfvV2', 'runner');

-- 示例奖牌数据
INSERT INTO medals (name, year, model_url, thumbnail_url, description, sort_order, is_featured) VALUES
('2025 兰马完赛奖牌', 2025, '/models/medal-2025.glb', '/images/medal-2025.jpg', '<h3>马踏飞燕·丝路遗韵</h3><p>2025年兰州马拉松完赛奖牌以"马踏飞燕"为设计灵感，融合铜奔马造型与黄河浪花纹样，展现兰州独特的历史文化与城市精神。</p>', 1, 1),
('2024 兰马完赛奖牌', 2024, '/models/medal-2024.glb', '/images/medal-2024.jpg', '<h3>黄河之韵</h3><p>2024年奖牌以黄河水波纹为底纹，中央镶嵌兰州地标中山桥剪影，象征跑者跨越黄河、挑战自我的精神。</p>', 2, 1),
('2023 兰马完赛奖牌', 2023, '/models/medal-2023.glb', '/images/medal-2023.jpg', '<h3>丝路金城</h3><p>2023年奖牌采用古丝路驼铃造型，点缀敦煌飞天纹样，寓意兰州作为丝路重镇的文化传承。</p>', 3, 0);

-- 示例地标数据（兰州马拉松沿线）
INSERT INTO landmarks (name, longitude, latitude, category, cover_image, content, video_url, distance_from_start, sort_order) VALUES
('兰州奥体中心', 103.7123450, 36.0823450, '体育场馆', '/images/landmark-olympic.jpg', '<p>兰州奥体中心是兰马赛事的起点和终点，位于七里河区，总建筑面积约32万平方米，是兰州最大的综合性体育场馆群。</p>', NULL, 0, 1),
('黄河母亲雕塑', 103.7765430, 36.0701230, '雕塑', '/images/landmark-mother.jpg', '<p>"黄河母亲"雕塑位于兰州市黄河南岸，由著名雕塑家何鄂创作，是兰州的城市象征。雕塑由"母亲"和"婴儿"组成，分别象征黄河和中华民族。</p>', 'https://example.com/video/huanghe-mother.mp4', 5.2, 2),
('中山桥', 103.8235640, 36.0610890, '桥梁', '/images/landmark-zhongshan.jpg', '<p>中山桥是兰州历史最悠久的黄河铁桥，建于1907年，由德国泰来商行承建，至今已有百余年历史，是兰州最重要的城市地标之一。</p>', NULL, 8.5, 3),
('白塔山公园', 103.8300000, 36.0689000, '公园', '/images/landmark-baita.jpg', '<p>白塔山公园位于兰州市黄河北岸，因山顶白塔寺而得名。公园依山而建，登顶可俯瞰黄河全景和兰州城市风光，是兰马赛道上的标志性景观节点。</p>', NULL, 9.0, 4),
('水车博览园', 103.7845670, 36.0678900, '历史建筑', '/images/landmark-waterwheel.jpg', '<p>兰州水车博览园展示了兰州古老的黄河水车文化。水车是黄河沿岸人民智慧的结晶，见证了兰州农耕文明的发展历程。</p>', NULL, 6.8, 5),
('黄河风情线', 103.7900000, 36.0680000, '自然景观', '/images/landmark-riverside.jpg', '<p>黄河风情线是兰州市沿黄河南岸打造的百里滨河景观带，融合了自然风光与人文景观，是兰马赛道中最具特色的路段之一。</p>', NULL, 7.0, 6);

-- 示例美食数据
INSERT INTO foods (name, category, description, address, rating, recommend, ai_analysis, sort_order) VALUES
('兰州牛肉面', '面食', '兰州最具代表性的传统面食，以"一清二白三红四绿五黄"闻名——汤清、萝卜白、辣椒油红、蒜苗香菜绿、面条黄亮。手工拉制，筋道爽滑。', '兰州市城关区酒泉路86号', 4.9, '来兰州必吃！地道牛肉面，汤鲜面筋，辣子香而不燥。', '兰州牛肉面是兰州的城市名片，讲究"一清二白三红四绿五黄"。面条由手工拉制，分为毛细、细、二细、三细、韭叶、薄宽、大宽等多种规格，满足不同口感需求。牛肉汤以牛骨和多种香料熬制数小时，汤色清澈而味醇厚。', 1),
('酿皮', '小吃', '兰州特色凉粉类小吃，用面粉洗出面筋后蒸制而成，切条后配以特制醋卤汁、蒜水、辣椒油、芝麻酱等调料，口感滑嫩酸辣。', '兰州市城关区正宁路小吃街', 4.6, '酸辣开胃，夏日消暑必选！', '酿皮是兰州人夏日最爱的凉食之一，制作工艺独特——将面团在水中反复揉洗，分离出面筋和淀粉浆，分别蒸制成型。成品酿皮晶莹透亮，口感柔韧滑爽，搭配特制醋卤和油泼辣子，酸辣适中，令人食欲大开。', 2),
('灰豆子', '小吃', '兰州传统甜食小吃，用麻豌豆与红枣、冰糖一同熬煮至绵软，呈深褐色糊状，口感香甜绵密，冬日暖身佳品。', '兰州市七里河区西站十字', 4.5, '冬日暖身必备，甜而不腻。', '灰豆子是兰州独特的传统甜品，选用优质麻豌豆，配以红枣、冰糖，用文火慢熬数小时，使豆子完全酥烂，汤汁浓稠呈深褐色。食用时可根据个人喜好加入少量桂花糖，更添清香。', 3),
('手抓羊肉', '正餐', '选用甘肃靖远滩羊，清水煮制保留原味，蘸椒盐食用。肉质鲜嫩不膻，肥瘦相间，是西北菜的代表之作。', '兰州市城关区农民巷88号', 4.8, '西北硬菜！羊肉鲜嫩无膻味，原汁原味。', '手抓羊肉是西北菜中的经典之作，选用甘肃靖远特产的滩羊，这种羊因生长在盐碱草地，肉质自带微咸，毫无膻味。烹制时仅用清水加少量盐和姜片，大火煮沸后转小火慢炖，最大限度保留羊肉本味。', 4),
('牛奶鸡蛋醪糟', '饮品', '兰州夜市招牌饮品，将醪糟煮沸后加入鲜牛奶和打散的鸡蛋，撒上葡萄干、花生碎、芝麻，香甜醇厚。', '兰州市城关区正宁路夜市', 4.7, '夜市招牌，奶香浓郁，暖心暖胃。', '牛奶鸡蛋醪糟是兰州夜市最受欢迎的饮品之一，起源于临夏地区，后风靡兰州。制作时将自制醪糟与鲜牛奶一同加热，在沸腾瞬间倒入打散的鸡蛋，形成细腻的蛋花，最后撒上葡萄干、花生碎、黑芝麻和枸杞，口感层次丰富。', 5),
('三炮台', '饮品', '兰州传统盖碗茶，以春尖茶为底，配以桂圆、枸杞、菊花、冰糖、红枣等，用滚水冲泡，香甜润喉。', '兰州市各大茶馆及餐厅', 4.5, '兰州人的待客之道，茶香四溢。', '三炮台又称"盖碗茶"，是兰州最具代表性的茶饮文化。所谓"三炮台"指茶碗、茶盖、茶托三件套。茶底选用云南春尖或陕青茶，配以桂圆、枸杞、菊花、冰糖、红枣、杏干等辅料，用滚水冲泡后加盖焖制，待冰糖融化后饮用，香甜回甘。', 6),
('兰州凉面', '面食', '兰州夏季特色面食，煮熟的面条过凉水后浇上特制醋卤汁，配以黄瓜丝、豆芽、面筋，酸辣爽口。', '兰州市城关区张掖路步行街', 4.4, '夏日消暑美味，酸辣爽口。', '兰州凉面是夏季消暑的绝佳选择，面条煮熟后迅速过凉水，使面条更加筋道爽滑。特制醋卤汁以香醋、蒜水、芥末油、芝麻酱等调制，浇在凉面上再配以黄瓜丝、绿豆芽、面筋块和油泼辣子，酸辣开胃。', 7),
('百合炒肉片', '正餐', '兰州特产兰州百合搭配猪肉片快炒，百合洁白如玉、口感清脆甘甜，与肉片的鲜香相得益彰。', '兰州市七里河区兰州百合大酒店', 4.6, '兰州百合清甜脆嫩，必尝特色。', '兰州百合是中国地理标志产品，产于兰州市七里河区及周边地区，因其品质优良被誉为"兰州百合甲天下"。兰州百合瓣大肉厚、洁白如玉、口感清甜脆嫩，既可入菜也可煮粥。百合炒肉片是最经典的家常做法，百合的清甜与猪肉的鲜香完美融合。', 8),
('甜醅子', '小吃', '兰州传统甜品，用青稞或小麦发酵制成，加入冰糖水饮用，酸甜可口，带有淡淡酒香，消暑解渴。', '兰州市城关区大众巷', 4.5, '酸甜清爽，夏日消暑圣品。', '甜醅子是兰州及甘肃地区的传统甜品小吃，选用优质青稞或小麦，经淘洗、蒸煮、晾凉后加入酒曲发酵而成。发酵好的甜醅子粒粒饱满、汤汁清亮，带有淡淡的酒香和酸甜味，加入冰镇冰糖水后饮用，清凉解暑、生津止渴。', 9),
('浆水面', '面食', '兰州特色酸味面食，以芹菜发酵而成的浆水做汤底，配以面条和腌韭菜，酸香开胃，夏日消暑。', '兰州市城关区五泉山脚下', 4.3, '酸香独特，地道兰州味。', '浆水面是兰州最具特色的传统面食之一，其灵魂在于"浆水"——用芹菜、莲花菜等蔬菜在面汤中发酵数日而成，带有独特的酸香。面条煮熟后浇入冰凉的浆水，配上腌韭菜和油泼辣子，酸爽清凉，是兰州人夏日消暑的必备美食。', 10);

-- 示例旅游景点数据
INSERT INTO tourism_spots (name, category, description, address, rating, latitude, longitude, ai_analysis, sort_order) VALUES
('兰州奥体中心', '地标建筑', '兰州奥体中心是兰马赛事的起点和终点，位于七里河区，总建筑面积约32万平方米。包括主体育场、体育馆、游泳馆、网球馆等设施，是兰州最大的综合性体育场馆群。建筑造型以"飞天"丝带为设计灵感，现代感十足。', '兰州市七里河区南滨河中路', 4.6, 36.082345, 103.712345, '兰州奥体中心作为兰州马拉松的起终点，是展示兰州城市新形象的重要窗口。其建筑设计融合了敦煌飞天丝带的灵动元素，三个主要场馆呈品字形排列，寓意"三足鼎立"。建议赛前提前踩点，熟悉起跑区域和存包位置。', 1),
('中山桥', '历史文化', '中山桥是兰州历史最悠久的黄河铁桥，建于1907年，由德国泰来商行承建，至今已有百余年历史。桥身钢桁架结构，全长233.5米，是黄河上第一座永久性铁桥，也是兰州最重要的城市地标。', '兰州市城关区滨河路中段', 4.7, 36.061089, 103.823564, '中山桥见证了兰州从边陲重镇到现代化都市的百年变迁。作为黄河第一桥，其德国制造的钢桁架结构历经百年仍坚固如初。夜晚灯光亮起时，铁桥倒映在黄河水中，是摄影爱好者的绝佳取景点。', 2),
('白塔山公园', '公园', '白塔山公园位于黄河北岸，因山顶元代白塔寺而得名。公园依山而建，海拔约1700米，登顶可俯瞰黄河全景和兰州城市风光。山上古树参天、亭台楼阁错落有致，是兰州市民休闲锻炼的好去处。', '兰州市城关区北滨河中路', 4.5, 36.068900, 103.830000, '白塔山公园是俯瞰兰州城市全景的最佳地点。从山顶白塔寺平台望去，黄河如带穿城而过，中山桥横跨两岸，兰州城区尽收眼底。建议傍晚时分登山，可同时欣赏日落和城市华灯初上的美景。', 3),
('黄河母亲雕塑', '地标建筑', '"黄河母亲"雕塑位于黄河南岸，由著名雕塑家何鄂创作，是兰州的城市象征。雕塑由"母亲"和"男婴"组成，分别象征黄河和中华民族，基座上刻有水波纹和鱼纹图案，寓意中华文明源远流长。', '兰州市城关区南滨河中路', 4.5, 36.070123, 103.776543, '黄河母亲雕塑是国内展现黄河文化最具代表性的雕塑作品之一。雕塑采用红砂岩材质，母亲秀发飘垂、体态优雅，怀抱婴儿寓意黄河母亲哺育中华儿女。雕塑周边的滨河步道是兰马赛道的重要路段，跑者经过时不妨留意。', 4),
('甘肃省博物馆', '博物馆', '甘肃省博物馆是西北地区最大的综合性博物馆之一，馆藏文物超过35万件。镇馆之宝包括铜奔马（马踏飞燕）、汉代医简、彩陶王等。博物馆建筑气势恢宏，展览内容包括丝绸之路、彩陶文化、佛教艺术等。', '兰州市七里河区西津西路3号', 4.8, 36.067500, 103.779000, '甘肃省博物馆是了解甘肃及丝绸之路文化的必去之地。铜奔马（马踏飞燕）作为中国旅游标志，其造型优美、动态十足，展现了汉代青铜铸造工艺的巅峰水平。建议预留2-3小时参观，重点参观丝绸之路文明展和彩陶展。', 5),
('五泉山公园', '公园', '五泉山公园位于兰州市区南侧皋兰山北麓，因有惠泉、甘露泉、掬月泉、摸子泉、蒙泉五眼泉水而得名。公园内古建筑群依山而建，包括崇庆寺、千佛阁、地藏寺等，是兰州最大的山地公园。', '兰州市城关区五泉南路', 4.4, 36.041000, 103.829000, '五泉山公园是兰州历史最悠久的公园之一，五眼泉水各具特色。公园依皋兰山而建，从山脚到山顶高差约200米，登山过程本身就是一种享受。每年农历四月初八的庙会是五泉山最热闹的时候。', 6),
('黄河风情线', '自然景观', '黄河风情线是兰州市沿黄河南北两岸打造的百里滨河景观带，全长约40公里。沿线有中山桥、黄河母亲、水车博览园、体育公园等多个景点，融合了自然风光与人文景观，是兰州最具特色的滨水休闲带。', '兰州市城关区至七里河区黄河南北两岸', 4.6, 36.068000, 103.790000, '黄河风情线是兰州的城市客厅，也是兰马赛道的核心路段。沿线步道平整宽阔，适合散步、跑步和骑行。建议从中山桥出发，沿南岸向西至黄河母亲雕塑，全程约3公里，是体验兰州黄河文化的最佳路线。', 7),
('兰州水墨丹霞景区', '自然景观', '兰州水墨丹霞景区位于永登县，距兰州市区约40公里，是西北地区规模最大、色彩最丰富的丹霞地貌之一。不同于张掖丹霞的浓烈，兰州丹霞以水墨般的淡雅色调著称，红、黄、白、绿等色彩层次分明。', '兰州市永登县树屏镇', 4.7, 36.420000, 103.610000, '兰州水墨丹霞以其独特的淡雅色调区别于其他丹霞地貌，宛如一幅天然水墨画。景区内设有多个观景台和徒步路线，全程游览约需3-4小时。建议清晨或傍晚前往，此时阳光斜照，丹霞色彩最为绚丽。', 8),
('兰州黄河楼', '地标建筑', '兰州黄河楼位于七里河区马滩片区，楼高约80米，是兰州的新地标建筑。登楼可360度俯瞰兰州城市全景和黄河风光，楼内设有黄河文化展览馆，展示黄河文明发展史。', '兰州市七里河区马滩', 4.5, 36.074000, 103.704000, '黄河楼是兰州近年来打造的文化新地标，建筑风格融合了汉代楼阁的雄浑与唐代建筑的华美。登临顶层观景台，黄河如丝带般蜿蜒穿城而过，兰州城市全貌尽收眼底。建议黄昏时分登楼，欣赏黄河落日。', 9),
('兴隆山自然保护区', '自然景观', '兴隆山位于兰州市榆中县，距市区约60公里，是国家4A级旅游景区和国家级自然保护区。山上有成吉思汗文物陈列馆、太白泉、滴泪岩等景点，夏季凉爽宜人，是兰州人避暑胜地。', '兰州市榆中县兴隆山镇', 4.6, 35.820000, 104.080000, '兴隆山是兰州周边最受欢迎的自然风景区之一，分为东山和西山两部分。东山以寺庙建筑群闻名，西山则以自然风光取胜。山上植被茂密、空气清新，夏季平均气温比市区低5-8°C，是理想的避暑胜地。', 10);

-- 示例天气数据（兰州）
INSERT INTO weather_data (location, record_time, temperature, feels_like, temp_min, temp_max, humidity, pressure, wind_speed, wind_direction, weather_condition, weather_code, precipitation, visibility, uv_index, air_quality, forecast_type, source) VALUES
('兰州', '2026-05-18 08:00:00', 18.5, 17.0, 14.0, 22.0, 45, 1015, 2.5, '东南风', '多云', 801, 0, 10.0, 5, 72, 'current', '中国气象局'),
('兰州', '2026-05-18 14:00:00', 25.0, 24.0, 14.0, 25.0, 35, 1013, 3.2, '东南风', '晴', 800, 0, 15.0, 8, 68, 'current', '中国气象局'),
('兰州', '2026-05-19 08:00:00', 20.0, 19.0, 15.0, 26.0, 40, 1012, 2.8, '南风', '晴', 800, 0, 12.0, 6, 75, 'current', '中国气象局'),
('兰州', '2026-05-19 14:00:00', 26.5, 25.5, 15.0, 26.5, 30, 1010, 3.5, '南风', '晴', 800, 0, 15.0, 9, 70, 'current', '中国气象局'),
('兰州', '2026-05-20 08:00:00', 19.5, 18.5, 13.0, 24.0, 50, 1013, 2.0, '东风', '多云', 802, 0, 10.0, 4, 80, 'current', '中国气象局');

-- 示例跑者故事
INSERT INTO stories (user_id, race_year, bib_number, finish_time, title, content, images, is_public, likes_count) VALUES
(2, 2025, 'A01234', '4:32:10', '我的首次兰马全马之旅', '<p>这是我第一次参加兰州马拉松，全程42.195公里，沿着黄河风情线奔跑，每一公里都充满了感动。</p><p>清晨的兰州奥体中心人声鼎沸，3万多名跑者齐聚一堂。发令枪响后，人群如潮水般涌出起点。经过中山桥时，黄河在晨光下闪闪发光，那一刻我热泪盈眶。</p><p>跑到黄河母亲雕塑时，观众们的加油声震耳欲聋。虽然最后几公里非常艰难，但冲过终点线的那一刻，所有的付出都值得了！</p>', '["/images/story-runner1-1.jpg","/images/story-runner1-2.jpg"]', 1, 12);

-- 示例小兰发布
INSERT INTO publications (title, summary, cover_image, content, sort_order, is_published) VALUES
('2025兰州马拉松完赛奖牌正式发布', '2025年兰州马拉松完赛奖牌以"马踏飞燕"为设计灵感，融合铜奔马造型与黄河浪花纹样，展现兰州独特的历史文化与城市精神。', '/images/medal-2025.jpg', '<h2>马踏飞燕·丝路遗韵</h2><p>2025年兰州马拉松完赛奖牌正式发布！本届奖牌以"马踏飞燕"为设计灵感，融合铜奔马造型与黄河浪花纹样，展现兰州独特的历史文化与城市精神。</p><img src="/images/medal-2025.jpg" alt="2025奖牌" style="max-width:100%;border-radius:12px;margin:16px 0;" /><p>奖牌正面采用铜奔马腾空姿态，背面则雕刻有黄河水波纹路，象征着跑者如黄河奔涌般的勇气与力量。整体设计将兰州的城市精神与马拉松运动的激情完美融合。</p><p><strong>设计亮点：</strong></p><ul><li>正面：马踏飞燕造型，象征速度与力量</li><li>背面：黄河水波纹，代表生生不息</li><li>材质：锌合金镀金工艺</li><li>尺寸：直径70mm，厚度5mm</li></ul>', 1, 1),
('兰马赛道沿线文化地标巡礼——中山桥', '中山桥是兰州历史最悠久的黄河铁桥，建于1907年，至今已有百余年历史，是兰州最重要的城市地标。', '/images/landmark-zhongshan.jpg', '<h2>百年铁桥·黄河第一桥</h2><p>中山桥，位于甘肃省兰州市城关区，是兰州历史最悠久的黄河铁桥，也是黄河上第一座真正意义上的永久性铁桥，素有"黄河第一桥"的美誉。</p><img src="/images/landmark-zhongshan.jpg" alt="中山桥" style="max-width:100%;border-radius:12px;margin:16px 0;" /><p>中山桥建于1907年（清光绪三十三年），由德国泰来商行承建，美国桥梁公司设计。桥身全长233.5米，宽8.36米，为钢桁架结构，造型古朴壮观。</p><p>作为兰马赛道上的标志性景观节点，跑者们从中山桥上跑过时，脚下是奔流不息的黄河水，远处是巍峨的白塔山，这样的奔跑体验在世界马拉松赛道上都是独一无二的。</p><p><strong>小贴士：</strong>每年兰马赛事期间，中山桥会在清晨为跑者专门开放，届时桥上只有跑者和志愿者，是拍摄比赛照片的绝佳时机。</p>', 2, 1),
('2025兰马参赛指南——赛前准备全攻略', '距离2025兰州马拉松开赛还有一个月，这份参赛指南涵盖了赛前训练、装备准备、饮食调整等全方位建议。', '/images/44.jpg', '<h2>备战兰马·从此刻开始</h2><p>距离2025兰州马拉松开赛还有一个月，无论你是首次参赛的新手还是经验丰富的老跑者，充分的赛前准备都是取得好成绩的关键。</p><h3>🏃 赛前训练建议</h3><p>最后一个月应以减量训练为主，逐步降低跑量但保持强度。建议：</p><ul><li>赛前3周：进行最后一次长距离拉练（25-30km）</li><li>赛前2周：减量至平时跑量的60%</li><li>赛前1周：减量至平时跑量的30%，以短距离放松跑为主</li><li>赛前3天：完全休息或仅做轻松活动</li></ul><h3>🥗 饮食调整</h3><p>赛前一周开始增加碳水化合物的摄入，建议：</p><ul><li>赛前3-4天：碳水供能比例提升至70%</li><li>赛前1天：以易消化的食物为主，避免油腻</li><li>比赛当天早餐：赛前2-3小时进食，以面包、香蕉等易消化食物为主</li></ul><h3>🎒 装备清单</h3><ul><li>参赛号码布（别在衣服前面）</li><li>计时芯片（按说明固定在鞋带上）</li><li>跑鞋（建议穿已磨合过50km以上的旧鞋）</li><li>运动袜（避免新袜子上场）</li><li>能量胶和盐丸（4-5个能量胶，3-4个盐丸）</li><li>空顶帽和防晒霜（兰州紫外线强）</li></ul><img src="/images/44.jpg" alt="兰马参赛" style="max-width:100%;border-radius:12px;margin:16px 0;" /><p>祝各位跑者在2025兰州马拉松中跑出好成绩，安全完赛！</p>', 3, 1);

-- 示例历年马拉松
INSERT INTO marathons (year, name, date, location, slogan, description, images, participant_count, sort_order) VALUES
(2025, '2025兰州马拉松', '2025-06-11', '兰州奥体中心', '奔跑兰州，逐梦黄河', '<p>2025年兰州马拉松设马拉松、半程马拉松、健康跑、家庭跑四个项目，总规模约4万人。赛事路线以兰州奥体中心为起终点，途经黄河母亲雕塑、中山桥、白塔山等城市地标。</p><p>本届赛事完赛奖牌以"马踏飞燕"为设计灵感，融合铜奔马造型与黄河浪花纹样，展现兰州独特的历史文化。</p>', '["/images/44.jpg"]', 40000, 1),
(2024, '2024兰州马拉松', '2024-05-26', '兰州奥体中心', '兰马十年，感恩有你', '<p>2024兰州马拉松是兰马十周年庆典，赛事规模扩大到4万人，首次采用抽签方式确定参赛资格。赛道沿黄河风情线展开，选手在奔跑中可欣赏黄河两岸的壮丽风光。</p><p>十周年特别奖牌以"黄河之韵"为主题，采用黄河水波纹底纹设计，中央镶嵌中山桥剪影。</p>', '["/images/44.jpg"]', 40000, 2),
(2023, '2023兰州马拉松', '2023-06-11', '兰州奥体中心', '同心共筑，梦想起航', '<p>2023兰州马拉松是疫情后的首届兰马，赛事设马拉松、半程马拉松、健康跑三个项目，总规模约2.5万人。赛事从兰州奥体中心出发，沿黄河风情线展开，终点返回奥体中心。</p><p>本届赛事以"丝路金城"为主题，奖牌采用古丝路驼铃造型，点缀敦煌飞天纹样。</p>', '["/images/44.jpg"]', 25000, 3);
