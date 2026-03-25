# HeritageHub: A Community Heritage Resource Sharing and Curation Platform

一个基于 Spring Boot 3、Spring Security、JPA 和 MySQL 的资源管理系统。项目面向“社区文化/地方遗产资源”场景，支持用户注册登录、投稿者提交资源、管理员审核发布、公众检索浏览与评论，并附带一个静态前端页面用于演示完整流程。


## 项目功能概览

1.Authentication

2.Profile and User Management

3.Resource Draft Management 仇肖涵
主要功能是支持资源贡献者（Contributor）在正式提交审核前，对文化遗产资源内容进行创建和管理。首先，贡献者可以创建新的资源草稿，并在草稿阶段持续编辑和完善内容，包括填写资源的基本信息和相关描述。资源信息通常包含标题（title）、分类（category）、标签（tags）、描述（description）等元数据，用于确保资源在提交审核前具有完整且规范的内容结构。系统允许贡献者多次保存草稿，并在后续时间继续编辑，避免因中断操作而导致数据丢失。其次，为了方便贡献者管理多个未完成的资源，系统提供草稿列表功能，用户可以查看自己创建的所有草稿，并根据需要继续编辑或补充内容。系统会自动为新创建的资源设置默认状态为“Draft”，以区分尚未提交审核的资源。通过该模块，贡献者可以在进入审核流程之前充分准备资源内容，从而提高后续审核的效率和资源质量。

4.Submission and Resubmission

5.Review Workflow  陈子熹
首先，Reviewer 能查看待审核资源列表，并按提交时间排序或按贡献者筛选；然后，Reviewer 可以进入资源详情页，查看 metadata（元数据）以及附件或外部链接，以支持审核判断。接着，Reviewer 可以对资源执行 approve 或 reject：批准后资源会公开展示，拒绝后系统会保存反馈、审核人身份和时间戳。最后，Contributor 能查看 rejection feedback、修改被拒资源并重新提交，使资源重新进入待审核列表，形成可追踪的 review cycle（审核循环）
6.Public Resource Discovery 李慕阳

7.Resource Comment Management 许亦多

8.Master Data Management 邱虹瑜
核心任务是由平台管理员对资源category（分类）进行统一管理。首先，管理员可以对分类执行完整的增删改查操作，包括创建新分类、编辑已有分类的名称与描述、浏览和搜索分类列表，以及删除不再使用的分类（已被引用的分类会被系统阻止删除）。其次，为保证所有变更的可追溯性，模块还提供审计日志功能，自动记录每次操作的执行人、时间和变更内容，并支持筛选查询和导出文件，且仅限授权用户访问。

9.Administrative Operations and Archiving 张亚楠
首先，Administrator 可以执行“紧急撤回（Emergency Unpublishing）”以快速处理违规内容，并支持对资源进行“批量归档与恢复（Bulk Archiving & Restoration）”，实现对平台资源生命周期的有效管控。然后，系统会实时生成“不可篡改的审计日志（Audit Logs）”，记录所有管理行为的操作人与时间戳，确保行政操作的可追溯性。接着，管理员能够处理“发布后更正请求（Correction Requests）”，在审核通过后动态更新已发布资源的元数据，以保证平台信息的准确性。最后，管理员可以发布“全站公告（System Announcements）”来传达维护信息或政策变更，并支持基于数据库的用户隐藏逻辑，确保沟通的高效性与用户体验，从而为平台提供全方位的合规保障与行政支持。

## 技术栈

- Java 21
- Spring Boot 3.5
- Spring Web
- Spring Data JPA
- Spring Security
- JJWT
- MySQL
- 原生 HTML / CSS / JavaScript 静态页面

## 角色与业务流程

### 用户角色

- `REGISTERED_VIEWER`：普通注册用户，可浏览、查看详情、评论、修改自己的个人资料
- `CONTRIBUTOR`：投稿者，可创建资源草稿、更新自己的资源、提交审核；真正提交前需要管理员审批资格
- `ADMIN_REVIEWER`：管理员/审核员，可审批投稿者、维护分类和标签、审核资源、归档资源

### 资源状态流转

`DRAFT -> PENDING_REVIEW -> APPROVED / REJECTED -> ARCHIVED`

- `DRAFT`：投稿者保存的草稿
- `PENDING_REVIEW`：已提交，等待管理员审核
- `APPROVED`：审核通过，可公开检索和查看
- `REJECTED`：审核驳回，可修改后重新提交
- `ARCHIVED`：管理员归档，不再出现在公开检索结果中

## 运行方式

### 环境要求

- JDK 21
- MySQL 8+
- Maven 或项目自带 Maven Wrapper

### 数据库与环境变量

默认配置位于 `src/main/resources/application.properties`，核心变量如下：

- `DB_URL`：默认 `jdbc:mysql://127.0.0.1:3306/CPT202_Project_DB?...`
- `DB_USER`：默认 `root`
- `DB_PASSWORD`：默认空
- `JWT_SECRET`：JWT 签名密钥
- `JWT_EXPIRATION_MS`：JWT 过期时间，默认 24 小时

启动前请先创建数据库：

```sql
CREATE DATABASE CPT202_Project_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 启动命令

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

通用 Maven:

```bash
./mvnw spring-boot:run
```

启动后访问：

- 首页：`http://localhost:8080/`
- 数据库测试：`http://localhost:8080/api/db/view`

系统会在启动时自动补一个默认管理员账号：

- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```text
src
├─ main
│  ├─ java/com/cpt202_1/taskmanager
│  │  ├─ config
│  │  ├─ controllers
│  │  ├─ dto/request
│  │  ├─ dto/response
│  │  ├─ exception
│  │  ├─ pojo
│  │  ├─ pojo/enums
│  │  ├─ repository
│  │  ├─ security
│  │  └─ service
│  └─ resources
│     ├─ application.properties
│     └─ static
└─ test
```

## 核心分层关系

- `Controller`：接收 HTTP 请求，解析参数，调用业务服务
- `PlatformService`：封装主要业务规则、权限校验、状态流转、DTO 转换
- `Repository`：负责数据库访问
- `Pojo/Enum`：定义实体结构和枚举状态
- `Security`：处理 JWT、Spring Security 认证和授权
- `DTO`：隔离请求体与响应体，避免直接暴露实体

## 代码文件职责说明

下面的表格只保留文件名，具体所在位置看对应的小节标题和包名。

### 1. 根目录与启动配置

| 文件 | 作用 |
| --- | --- |
| `pom.xml` | Maven 项目描述文件，声明 Spring Boot、JPA、Security、JWT、MySQL 等依赖与 Java 21 版本。 |
| `TaskmanagerApplication.java` | Spring Boot 启动入口，负责启动应用，并启用 `@ConfigurationProperties` 扫描。 |
| `application.properties` | 应用基础配置，定义数据源、JPA 行为、JWT 默认参数。 |

### 2. `config` 包

| 文件 | 作用 |
| --- | --- |
| `BootstrapDataConfig.java` | 应用启动后执行初始化逻辑：如果数据库中没有 `admin`，就创建默认管理员；如果发现旧的明文密码，会升级成 BCrypt。 |
| `JwtProperties.java` | 读取 `app.jwt.*` 配置，向 `JwtService` 提供 JWT 密钥和过期时间。 |

### 3. `controllers` 包

| 文件 | 作用 |
| --- | --- |
| `AuthController.java` | 处理注册、登录、登出接口；登录成功后签发 JWT。 |
| `ProfileController.java` | 提供用户资料查看和更新接口，并限制只能本人或管理员访问。 |
| `PublicResourceController.java` | 公开资源接口，负责分页检索、查看详情、查看评论、发表评论。 |
| `ResourceWorkflowController.java` | 资源工作流接口，负责投稿者创建草稿、更新草稿、提交审核、重新提交，以及查看“我的资源”；也包含管理员审核入口。 |
| `AdminController.java` | 管理员接口，负责审批投稿者、创建分类、创建标签、查询待审核资源、归档资源。 |
| `taskController.java` | 提供数据库探活和可视化诊断页面，用于快速验证数据库是否连通。 |

### 4. `service` 包

| 文件 | 作用 |
| --- | --- |
| `PlatformService.java` | 项目唯一的核心业务服务层，集中处理用户注册登录、资料修改、投稿者审批、分类标签管理、资源状态流转、公开检索、评论、分页与排序、DTO 映射等逻辑。 |

### 5. `security` 包

| 文件 | 作用 |
| --- | --- |
| `SecurityConfig.java` | Spring Security 总配置，定义开放接口、角色权限、异常返回格式、密码加密器，并注册 JWT 过滤器。 |
| `JwtAuthenticationFilter.java` | 从请求头读取 Bearer Token，校验 JWT，查库确认用户状态，并把认证信息放进 Spring Security 上下文。 |
| `JwtService.java` | 负责 JWT 的生成、解析、校验和过期时间管理。 |
| `AuthenticatedUser.java` | 当前登录用户的轻量级认证对象，供控制器用 `@AuthenticationPrincipal` 直接读取。 |

### 6. `repository` 包

| 文件 | 作用 |
| --- | --- |
| `UserRepository.java` | 用户表访问接口，提供按用户名查询、用户名查重、邮箱查重。 |
| `CategoryRepository.java` | 分类表访问接口，提供按名称忽略大小写查询。 |
| `TagRepository.java` | 标签表访问接口，提供按名称查询和批量按名称查询。 |
| `ResourceEntryRepository.java` | 资源表访问接口，支持 `Specification` 动态检索与“按投稿者查询我的资源”。 |
| `ResourceCommentRepository.java` | 评论表访问接口，提供按资源查询评论列表。 |

### 7. `pojo` 实体包

| 文件 | 作用 |
| --- | --- |
| `User.java` | 用户实体，对应 `tb_user`，包含用户名、密码、邮箱、角色、是否启用、投稿者审批状态和时间戳。 |
| `Category.java` | 分类实体，对应 `tb_category`，保存分类名称和描述。 |
| `Tag.java` | 标签实体，对应 `tb_tag`，保存资源标签名称。 |
| `ResourceEntry.java` | 资源实体，对应 `tb_resource`，保存标题、主题、地点、描述、资源链接、版权声明、审核信息、分类、标签及多个业务时间点。 |
| `ResourceComment.java` | 评论实体，对应 `tb_resource_comment`，表示用户对某个已发布资源的评论记录。 |

### 8. `pojo/enums` 枚举包

| 文件 | 作用 |
| --- | --- |
| `UserRole.java` | 定义系统中的三类用户角色：管理员、投稿者、普通注册用户。 |
| `ResourceStatus.java` | 定义资源在工作流中的状态：草稿、待审、通过、驳回、归档。 |
| `ReviewDecision.java` | 定义管理员审核动作：通过或驳回。 |

### 9. `dto/request` 包

| 文件 | 作用 |
| --- | --- |
| `LoginRequest.java` | 登录请求体，包含用户名和密码。 |
| `RegisterRequest.java` | 注册请求体，包含用户名、密码、邮箱和目标角色。 |
| `UpdateProfileRequest.java` | 用户资料更新请求体，支持用户名、邮箱、密码的部分更新。 |
| `CreateCategoryRequest.java` | 管理员创建分类时使用的请求体。 |
| `CreateTagRequest.java` | 管理员创建标签时使用的请求体。 |
| `ResourceUpsertRequest.java` | 创建或更新资源时的统一请求体，包含标题、主题、地点、描述、分类、标签、文件地址、外链、版权声明。 |
| `ReviewRequest.java` | 管理员审核资源时的请求体，包含审核决定和反馈。 |
| `CommentRequest.java` | 用户发表评论时的请求体，只包含评论内容。 |

### 10. `dto/response` 包

| 文件 | 作用 |
| --- | --- |
| `UserSummary.java` | 对外返回的用户摘要信息，不暴露密码等敏感字段。 |
| `AuthResponse.java` | 登录成功后的响应体，包含 JWT、令牌类型、过期时间和当前用户信息。 |
| `ResourceSummary.java` | 资源列表项响应体，用于公共检索、我的资源、待审核队列等列表场景。 |
| `ResourceDetail.java` | 资源详情响应体，提供比列表更完整的资源内容和审核时间信息。 |
| `CommentView.java` | 评论展示响应体，返回评论人和评论内容。 |
| `PageResult.java` | 统一分页响应包装类，把 Spring Data 的 `Page` 转换为前端更容易使用的结构。 |

### 11. `exception` 包

| 文件 | 作用 |
| --- | --- |
| `ApiException.java` | 自定义业务异常，允许在业务层直接绑定 HTTP 状态码和错误消息。 |
| `GlobalExceptionHandler.java` | 全局异常处理器，把业务异常和未知异常统一转换成 JSON 错误响应。 |

### 12. 前端静态文件

| 文件 | 作用 |
| --- | --- |
| `index.html` | 演示页面入口，包含登录、注册、公开浏览、投稿者工作台、管理员审核台三个主要区域。 |
| `app.js` | 前端主要逻辑，负责调用后端 API、保存 JWT、控制角色视图切换、分页、评论和审核交互。 |
| `styles.css` | 页面样式文件，定义配色、布局、卡片、按钮、响应式规则。 |

### 13. 测试文件

| 文件 | 作用 |
| --- | --- |
| `TaskmanagerApplicationTests.java` | 最基础的 Spring Boot 上下文加载测试，用于确认应用能正常启动。 |

## 主要接口分组

| 接口前缀 | 对应控制器 | 说明 |
| --- | --- | --- |
| `/api/auth` | `AuthController` | 注册、登录、登出 |
| `/api/users` | `ProfileController` | 查看和修改个人资料 |
| `/api/resources` | `ResourceWorkflowController` | 草稿创建、提交、重提、审核、我的资源 |
| `/api/admin` | `AdminController` | 管理员审批与后台管理 |
| `/api/public/resources` | `PublicResourceController` | 公开检索、详情、评论 |
| `/api/db` | `taskController` | 数据库连通性测试 |

## 设计特点

- 业务规则集中在 `PlatformService`，控制器相对薄，便于后续重构和测试
- 使用 `PageResult` 统一分页返回格式，前后端更容易对接
- 通过 `JwtAuthenticationFilter + AuthenticatedUser` 简化登录用户信息获取
- 对旧数据做了“明文密码登录后自动升级为 BCrypt”的兼容处理
- 公开浏览与后台管理共用资源筛选逻辑，减少重复代码

## 当前实现的适用场景

这个项目适合作为课程项目、Spring Boot 分层架构示例，或者“投稿审核类平台”的后端模板。它已经覆盖了典型的用户、权限、审核流、分页检索、评论和静态前端演示，但测试、接口文档、删除/编辑评论、文件上传、对象存储等能力还可以继续扩展。
