# 社区文化遗产资源平台（初版）

每次拉取更新代码：git pull origin master

本项目是一个基于 Spring Boot 的社区文化遗产资源共享与策展平台，支持资源投稿、审核发布、公开浏览与评论。

## 1. 当前已实现功能

- 用户注册、登录、登出（初版为无状态接口）
- 角色模型：
- `ADMIN_REVIEWER`（管理员/审核员）
- `CONTRIBUTOR`（投稿者）
- `REGISTERED_VIEWER`（注册浏览者）
- 管理员审批贡献者资格
- 分类/标签主数据管理
- 资源状态流转：
- `DRAFT`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `ARCHIVED`
- 仅公开展示已审批通过资源
- 基础评论功能
- 内置简易前端页面（登录、投稿、审核、浏览）

## 2. 技术栈

- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Data JPA
- MySQL 8.x
- Maven Wrapper
- 原生静态前端（HTML/CSS/JS）

## 3. 目录与文件详细说明

### 3.1 根目录

- `pom.xml`
- Maven 项目配置文件，定义依赖、插件、Java 版本。

- `mvnw` / `mvnw.cmd`
- Maven Wrapper 启动脚本，保证不同机器可统一执行 Maven 命令。

- `.gitignore`
- Git 忽略规则（如 `target/` 等）。

- `.gitattributes`
- Git 属性配置（换行等）。

- `README.md`
- 项目说明文档（本文件）。

- `HELP.md`
- Spring Initializr 生成的辅助说明（可选阅读）。

- `.mvn/wrapper/maven-wrapper.properties`
- Maven Wrapper 具体版本与下载配置。

- `.vscode/settings.json`
- VSCode 工作区配置（本地开发相关）。

- `target/`
- Maven 构建输出目录（编译产物、临时文件），不手写。

### 3.2 `src/main/java/com/cpt202_1/taskmanager`

#### 入口文件

- `TaskmanagerApplication.java`
- Spring Boot 启动入口类（`main` 方法）。

#### 配置层 `config/`

- `BootstrapDataConfig.java`
- 启动时初始化默认管理员账号（`admin/admin123`）。

#### 控制器层 `controllers/`

- `AuthController.java`
- 认证相关接口：注册、登录、登出。

- `ProfileController.java`
- 用户资料查询与修改接口。

- `AdminController.java`
- 管理端接口：
- 贡献者审批
- 待审批贡献者列表
- 分类/标签管理
- 待审核资源列表
- 资源归档

- `ResourceWorkflowController.java`
- 投稿与审核工作流接口：
- 创建草稿
- 编辑资源
- 提交审核
- 重提审核
- 审核通过/驳回
- 查询我的资源

- `PublicResourceController.java`
- 公开资源接口：
- 检索
- 详情
- 评论新增/查询

- `taskController.java`
- 数据库连通测试接口（`/api/db/ping`, `/api/db/view`）。

#### 业务层 `service/`

- `PlatformService.java`
- 核心业务逻辑与业务规则校验集中在此：
- 角色权限判断
- 贡献者审批校验
- 状态流转
- 公开可见性规则
- 评论规则

#### 数据访问层 `repository/`

- `UserRepository.java`
- 用户数据访问（按用户名/邮箱查询等）。

- `CategoryRepository.java`
- 分类数据访问。

- `TagRepository.java`
- 标签数据访问。

- `ResourceEntryRepository.java`
- 资源数据访问与条件检索能力。

- `ResourceCommentRepository.java`
- 评论数据访问。

#### 实体层 `pojo/`

- `User.java`
- 用户实体（角色、审批状态、启用状态、时间戳等）。

- `Category.java`
- 分类实体。

- `Tag.java`
- 标签实体。

- `ResourceEntry.java`
- 资源实体（标题、主题、地点、描述、分类、标签、审核信息、状态等）。

- `ResourceComment.java`
- 评论实体（作者、资源、内容、时间）。

##### 枚举 `pojo/enums/`

- `UserRole.java`
- 用户角色枚举。

- `ResourceStatus.java`
- 资源状态枚举。

- `ReviewDecision.java`
- 审核决定枚举（通过/驳回）。

#### DTO 层 `dto/`

##### 请求模型 `dto/request/`

- `RegisterRequest.java`
- 注册请求体模型。

- `LoginRequest.java`
- 登录请求体模型。

- `UpdateProfileRequest.java`
- 更新资料请求体模型。

- `CreateCategoryRequest.java`
- 新建分类请求体模型。

- `CreateTagRequest.java`
- 新建标签请求体模型。

- `ResourceUpsertRequest.java`
- 资源创建/编辑请求体模型。

- `ReviewRequest.java`
- 审核请求体模型（决定 + 反馈）。

- `CommentRequest.java`
- 评论请求体模型。

##### 响应模型 `dto/response/`

- `UserSummary.java`
- 用户摘要返回模型。

- `ResourceSummary.java`
- 资源列表返回模型。

- `ResourceDetail.java`
- 资源详情返回模型。

- `CommentView.java`
- 评论返回模型。

#### 异常层 `exception/`

- `ApiException.java`
- 业务异常类型（携带 HTTP 状态码）。

- `GlobalExceptionHandler.java`
- 全局异常处理器，统一返回错误结构。

### 3.3 `src/main/resources`

- `application.properties`
- 应用配置（数据源、JPA、应用参数）。

- `static/index.html`
- 前端页面入口（单页，集成登录/投稿/审核/浏览）。

- `static/styles.css`
- 前端样式文件。

- `static/app.js`
- 前端交互逻辑与 API 调用代码。

- `templates/`
- 服务器模板目录（当前版本未使用）。

### 3.4 测试目录 `src/test`

- `src/test/java/com/cpt202_1/taskmanager/TaskmanagerApplicationTests.java`
- Spring Boot 基础测试类（上下文加载测试）。

## 4. 数据库配置

默认配置（`application.properties`）：

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://127.0.0.1:3306/CPT202_Project_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=UTF-8}
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASSWORD:}
```

建议通过环境变量传密码：

- `DB_PASSWORD`

可选环境变量：

- `DB_URL`
- `DB_USER`

## 5. 运行方式（Windows PowerShell）

```powershell
cd 你电脑中的CPT202路径
$env:JAVA_HOME="你本地的Java路径"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$env:DB_PASSWORD="你的MySQL密码"
.\mvnw.cmd spring-boot:run "-Dmaven.test.skip=true"
```

启动后访问：

- 前端主页：`http://localhost:8080/`
- 数据库连通测试：`http://localhost:8080/api/db/view`

## 6. 已落实业务规则

- 仅审批通过的贡献者可提交/重提资源
- 仅 `APPROVED` 资源对公众可见
- `ARCHIVED` 资源不在公开列表展示

## 7. 当前版本边界

- 目前通过 `actorId` 参数模拟登录态（未接 JWT）
- 密码处理为明文（未使用 BCrypt）
- 上传功能暂以 URL 字段表示（未接真实文件存储）

## 8. 后续建议

- 接入 Spring Security + JWT
- 密码加密存储（BCrypt）
- 增加文件上传与存储服务
- 增加分页、排序、更多筛选
- 完善单元测试与集成测试
- 增加 OpenAPI/Swagger 文档
