# 非参数统计数字实验室 v2.0

**Nonparametric Statistics Digital Lab**  
GitHub Pages 静态网站部署包，适用于《非参数统计》课程教学、课堂演示与方法探索。

## 本次整合内容

- **综合实验**：临床疗效评价与统计推断，保留原有研究流程、交互任务、过程评分和实验记录。
- **Spearman 秩相关**：非线性关系与秩次交互演示；精确零分布、全排列穷举与 Monte Carlo 模拟。
- **Kendall τ 秩相关**：两两比较、协同/不协同对、并列值处理、零分布与 P 值演示。
- **Theil–Sen 稳健回归**：两点斜率、中位数估计、异常值影响、应用案例与斜率检验。
- **进阶统计工作台**：保留原有分析工具、研究策略和课程知识库。
- **教师中心**：保留本地实验记录、JSON 批量导入、复核与 CSV 导出。
- **知识检索评测**：保留课程知识库固定问题评测页面。

## 文件结构

```text
nonparam-lab/
├── index.html                 # 全新实验室首页
├── clinical-lab.html          # 临床疗效评价综合实验
├── advanced-lab.html          # 进阶统计工作台
├── teacher.html               # 教师中心与实验记录
├── evaluation.html            # 知识检索评测
├── labs/
│   ├── spearman-rank-lab.html # Spearman 秩关系交互实验
│   ├── spearman-null-lab.html # Spearman 精确零分布实验
│   ├── kendall-tau-lab.html   # Kendall τ 交互实验
│   └── theil-sen-lab.html     # Theil–Sen 稳健回归实验
└── assets/                    # 原有统计计算程序与统一导航样式
```

## 本地预览

进入 `nonparam-lab/` 目录后运行任意静态服务器，例如：

```bash
python -m http.server 8000
```

浏览器访问 `http://localhost:8000/`。

## GitHub Pages 部署

1. 解压本部署包，得到 `nonparam-lab/` 文件夹。
2. 在仓库中备份旧的 `nonparam-lab/` 文件夹。
3. 用本包中的 `nonparam-lab/` 完整替换旧文件夹，保留文件夹名称和层级。
4. 提交并推送到 GitHub。
5. 等待 GitHub Pages 部署完成，访问：
   `https://jujiaokang.github.io/nonparam-lab/`

所有站内链接均使用相对路径，适用于 GitHub Pages 的项目子路径部署。

## 数据与记录边界

- 所有演示数据均为模拟数据，不代表真实临床疗效或真实研究结果。
- 实验交互在浏览器本地运行，不需要后端服务。
- 实验记录保存在当前浏览器。GitHub Pages 不会自动收集全班记录。
- 教师可让提交者导出 JSON，再在教师中心批量导入、复核和导出 CSV。
- 统计结论需要结合研究设计、数据结构、并列值、独立性及方法适用条件解释。

## 维护原则

- 新增方法时，在 `labs/` 下增加独立实验页，并在 `assets/site-shell.js` 的导航数组及 `index.html` 实验卡片中登记。
- 新实验页引入 `../assets/site-shell.css` 和 `../assets/site-shell.js`，即可使用统一导航。
- 不要将统计计算逻辑迁移到首页；各专题实验保持独立、可单独维护。
