# 非参数统计实验室 · v0.2

本包为可直接部署到 GitHub Pages 的静态网站。使用 HTML、CSS、JavaScript，无需构建工具或服务器后端。

## 页面

- `index.html` — 实验室首页
- `clinical-lab.html` — 数字康复疗效评价综合实验（25步，100分）
- `teacher.html` — 当前浏览器实验进度、成绩及CSV/JSON导出
- `labs/spearman-rank-lab.html` — 非线性关系与秩（保留原有统计交互）
- `labs/spearman-null-lab.html` — Spearman精确零分布（保留原有统计交互）

## 更新内容

- 统一使用深色数据工作台界面，支持桌面和手机。
- 删去首页中的项目规划、建设说明、推广性语言和未开发功能卡片。
- 保留统计引擎、交互选择、25步评价、报告导出及原有Spearman算法。
- 统计方法提示仍为课程规则检索；不调用第三方AI模型。
- 主页从本地记录读取实验进度和成绩。
- 原Spearman网页增加统一的返回首页入口，统计实现不变。

## GitHub Pages 部署

如个人主页仓库为 `jujiaokang.github.io`：

1. 打开仓库，进入 `nonparam-lab` 文件夹；尚不存在则新建。
2. 将本压缩包内全部文件和文件夹上传到这个目录，覆盖旧版同名文件。保留 `assets` 和 `labs` 的目录结构。
3. 在仓库 Settings → Pages 中确认 Pages 已启用。等待GitHub完成部署后访问：
   `https://jujiaokang.github.io/nonparam-lab/`

以上为预期地址，需在用户实际部署后验证。旧的根目录网页 `spearman-lab.html` 不会被该文件夹覆盖。

## 本地测试

解压后双击 `index.html` 可查看多数功能。某些浏览器对 `file://` 页面的本地数据存储有限制，建议用本地静态服务器或 GitHub Pages 测试过程记录。

Node.js数值测试：`node tests/test_stats.js`。

## 使用边界

- 所有实验受试者数据都是教学模拟数据，不代表临床疗效。
- 成绩记录使用当前浏览器的 `localStorage`，并非跨设备教师管理服务。
- 没有服务器账户管理、在线大模型、正式平台接口或网络安全等级保护认证。
- 本包是可以操作的教学软件前端版本，不应当把尚未获得的外部资质写作已完成。
