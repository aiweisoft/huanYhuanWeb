# 缓一缓 · 管理后台

> 匿名情绪树洞 App「缓一缓」的后台，基于 [uni-admin](https://github.com/dcloudio/uni-admin) 改造。

App 端仓库：[aiweisoft/huanYhuan](https://github.com/aiweisoft/huanYhuan)

后台只做两件事：**看树洞、管文章**。没有数据大屏，也没有运营位配置。

---

## 功能

| 模块 | 能力 |
|---|---|
| 树洞审核 | 按状态筛选、查看单条、下架、处理举报 |
| 文章管理 | 列表按**更新时间倒序**；按已发布 / 草稿 / 已下架筛选；新建、编辑、发布、转草稿、下架、删除 |
| 批量导入 | 粘贴 JSON 数组（或 `export default [...]`），按 `id` 去重，可勾选「导入后直接发布」 |
| 预览 | 后台可直接读取 App 端同一份文章数据，改完刷新 App 即生效 |

### 批量导入的几个约定

- 不勾「导入后直接发布」→ **一律存草稿**，JSON 里的 `status` 不会覆盖这个选择（`hidden` 除外）
- 同 `id` 会跳过，重复导入不会产生重复文章
- 导入框不限制字数，右下角会显示「识别到 N 条 · M 字符」
- 单次最多 500 条，前端按 10 条一批提交
- 预计阅读时长建议按中文约 150 字/分、英文约 200 词/分估算，向上取整

## 和 App 的关系

后台和 App 共用同一个 uniCloud 支付宝云服务空间、同一个云对象 `huanhuan-co`、同一批集合：

- `huanhuan-posts` / `huanhuan-echoes` / `huanhuan-reports`
- `huanhuan-articles`

云对象的源码在 App 仓库里（`uniCloud-alipay/cloudfunctions/huanhuan-co`），**本仓库不重复维护**。改了接口要先在 App 项目里上传部署，再刷新后台。

## 本地跑起来

1. 用 HBuilderX 打开本目录
2. 右键 `uniCloud-alipay` → 关联云服务空间（选和 App 同一个空间）
3. 确认 App 项目里已经上传部署 `huanhuan-co`
4. `运行 → 运行到浏览器`
5. 用管理员账号登录；账号的 `role` 里需要包含 `admin`（在 uniCloud 控制台 → 用户管理里改）

后台所有管理方法都会在云对象里再次校验 `admin` 角色，前端隐藏按钮只是体验，不是权限。

## 目录结构

```
huanYhuanWeb/
├─ pages/huanhuan/
│  ├─ articles/       文章管理（列表、编辑、批量导入）
│  ├─ posts/          树洞管理（筛选、下架）
│  └─ reports/        举报处理
├─ common/
│  ├─ huanhuan-api.js 云对象调用封装
│  └─ huanhuan-seed-articles.js  内置文章种子
├─ uniCloud-alipay/
│  ├─ cloudfunctions/ 只放后台自己的云函数（如 uni-upgrade-center）
│  └─ database/       后台相关集合（菜单、升级中心等）
├─ admin.config.js    后台名称、菜单、登录页配置
└─ docs/              后台相关说明（huanhuan-admin.md）
```

## 技术栈

- uni-app（Vue 3）+ uni-admin 宽屏适配
- uniCloud 支付宝云 + 云对象 `huanhuan-co`
- uni-id 登录与角色权限

## 说明

- 后台默认没有开放注册，管理员账号在 uniCloud 控制台创建或从 App 端注册后手动加 `admin` 角色
- 文章正文只存摘要和段落，不搬运全文；来源和原文链接会一起保留

## 许可

MIT（沿用 uni-admin 模板），其余业务代码随 [huanYhuan](https://github.com/aiweisoft/huanYhuan) 一起按 Apache License 2.0 发布。
