# 缓一缓 · 管理后台（huanYhuanWeb）

基于 **uni-admin 原模板**，只负责管理端；面向用户的网页版在 `huanYhuanH5`。

## 功能

| 菜单 | 页面 | 依赖的云对象方法 |
|---|---|---|
| 缓一缓 → 树洞管理 | `/pages/huanhuan/posts/posts` | `adminListQueue` / `adminGetPost` / `adminModerate` |
| 缓一缓 → 文章管理 | `/pages/huanhuan/articles/articles` | `adminListArticles` / `adminGetArticle` / `adminSaveArticle` / `adminSetArticleStatus` / `adminDeleteArticle` / `adminSeedArticles` |
| 缓一缓 → 举报记录 | `/pages/huanhuan/reports/reports` | `adminListReports` / `adminGetPost` |

- 树洞管理：按状态（待审核 / 已发布 / 已下架 / 全部）和情绪筛选，分页 20 条
- 详情：全文、抱抱数、回应、举报记录、危机词标记、作者标识
- 操作：放行 / 下架 / 转审核；放行会清零举报计数
- 文章管理：新增 / 编辑 / 发布 / 下架 / 删除，正文按「一行一段」
- 批量导入：粘贴 JSON 数组，或 `tools/rss-import.mjs` 生成的 `articles.generated.js` 全文，
  自动去掉 `export default`、按 10 条一批写入，同 id 跳过；可勾选「导入后直接发布」
- 第一次使用可点「导入内置文章」，把 App 里那 12 篇写进云端（同 id 跳过）
- 举报记录：按帖子 ID 过滤，可直接跳到该帖详情

模板原有的统计、用户、角色、菜单、应用管理等页面保持不动。

## 权限

三个管理页在 `onLoad` 里检查 `uni_id_token`，未登录会跳到登录页并带上回跳地址；
云对象 `huanhuan-co` 里还会再校验 `admin` 角色，接口层不会被绕过。

1. 用管理员账号登录后台
2. uniCloud 控制台 → 用户管理 → 编辑角色 → 填 `admin`
3. 重新登录（token 里的 role 才会更新）

没有角色时页面会提示「当前账号没有 admin 角色」。

## 运行 / 发布

```bash
# 编译 H5
cli publish h5 --project "D:\Users\Administrator\Documents\HBuilderProjects\huanYhuanWeb"
```

或在 HBuilderX：`发行 → 网站-PC Web或手机H5`。

- H5 路由基址是 `/admin/`，部署时放到站点的 `/admin/` 目录
- 需要先在 uniCloud 控制台绑定 **H5 安全域名**，否则浏览器调用云对象会跨域失败
- 与用户端（`huanYhuanH5`）共用同一个支付宝空间 `new-hospital / env-00jy6yias971`
- 用户端部署在根目录 `/`，后台部署在 `/admin/`，互不影响

## 目录

```
common/huanhuan-api.js              云对象封装 + 文案/时间格式化
common/huanhuan-seed-articles.js    内置 12 篇，供「导入内置文章」用
pages/huanhuan/posts/posts.vue      树洞管理
pages/huanhuan/articles/articles.vue 文章管理
pages/huanhuan/reports/reports.vue  举报记录
admin.config.js                     staticMenu 里新增「缓一缓」分组
```

其余目录均为 uni-admin 原模板内容。
