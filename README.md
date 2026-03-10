# 社区文化遗产资源平台（初版）

本项目是一个基于 Spring Boot 的社区文化遗产资源共享与策展平台。  
支持用户注册登录、贡献者投稿、管理员审核发布、资源检索浏览与评论。

## 1. 当前实现范围

当前版本已实现以下核心功能：

- 用户注册、登录、登出（API 级，无状态）
- 角色模型：
- `ADMIN_REVIEWER`（管理员/审核员）
- `CONTRIBUTOR`（投稿者）
- `REGISTERED_VIEWER`（注册浏览者）
- 管理员审批贡献者资格
- 分类（Category）与标签（Tag）主数据管理
- 资源工作流状态：
- `DRAFT`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `ARCHIVED`
- 仅公开展示已审批通过的资源
- 资源详情查看
- 已通过资源的基础评论
- 同项目内置简易前端页面：
- 登录
- 投稿
- 审核
- 公开浏览

## 2. 技术栈

- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Data JPA
- MySQL 8.x
- Maven Wrapper（`mvnw` / `mvnw.cmd`）
- 静态前端（`src/main/resources/static`）

## 3. 项目目录结构

```text
src/main/java/com/cpt202_1/taskmanager
├─ config/        # 启动与初始化配置（如默认管理员）
├─ controllers/   # REST 控制器（接口入口）
├─ dto/           # 请求/响应 DTO
├─ exception/     # 统一异常处理
├─ pojo/          # JPA 实体
│  └─ enums/      # 领域枚举（角色/状态/审核决定）
├─ repository/    # JPA 数据访问层
└─ service/       # 业务逻辑与规则校验

src/main/resources
├─ application.properties
├─ static/        # 前端静态资源（index.html、app.js、styles.css）
└─ templates/     # 预留模板目录（当前基本未使用）
```

## 4. 数据库配置

`application.properties` 默认配置：

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://127.0.0.1:3306/CPT202_Project_DB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=UTF-8}
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASSWORD:}
```

建议通过环境变量传入数据库密码：

- `DB_PASSWORD`

可选环境变量：

- `DB_URL`
- `DB_USER`

## 5. 运行方式（Windows PowerShell）

在项目根目录执行：

```powershell
cd C:\Users\16973\Desktop\大三下\CPT202\project\taskmanager
$env:JAVA_HOME="C:\Users\16973\.vscode\extensions\redhat.java-1.53.0-win32-x64\jre\21.0.10-win32-x86_64"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$env:DB_PASSWORD="你的MySQL密码"
.\mvnw.cmd spring-boot:run "-Dmaven.test.skip=true"
```

启动后访问：

- 前端主页：`http://localhost:8080/`
- 数据库连通页：`http://localhost:8080/api/db/view`

## 6. 默认管理员账号（初始化数据）

系统首次启动时若不存在管理员，会自动创建：

- 用户名：`admin`
- 密码：`admin123`

对应代码位置：

- `src/main/java/com/cpt202_1/taskmanager/config/BootstrapDataConfig.java`

## 7. 主要接口分组

- 认证接口（Auth）：
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

- 用户资料（Profile）：
- `GET /api/users/{userId}`
- `PUT /api/users/{userId}`

- 管理端（Admin）：
- 贡献者审批与待审批列表
- 分类/标签管理
- 待审核资源列表
- 资源归档

- 投稿工作流（Contributor）：
- 创建/编辑草稿
- 提交审核/重提
- 查看我的资源

- 公开端（Public）：
- 检索已通过资源
- 查看资源详情
- 新增/查看评论

## 8. 已落实的业务规则

- 仅“已审批通过”的贡献者可以提交或重提资源
- 仅 `APPROVED` 资源对公众可见
- `ARCHIVED` 资源在公开列表中不可见

## 9. 当前版本说明

- 当前鉴权是简化实现：受保护接口通过 `actorId` 参数标识操作者
- 当前密码处理为明文（初版便于联调）
- 文件上传暂以 `fileUrl` / `externalLink` 字段表示，未接入真实存储

## 10. 后续建议

- 接入 Spring Security + JWT
- 密码改为 BCrypt 加密存储
- 接入真实文件上传（本地/云存储）
- 列表接口增加分页与排序
- 补充单元测试与集成测试
- 增加 OpenAPI/Swagger 文档
