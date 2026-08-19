# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

本仓库是一个部署在 **Gitee Pages** 的纯静态站点，用于每日发布 A 股复盘 HTML。所有复盘按 `reports/YYYY/MM/YYYY-MM-DD.html` 归档，首页 `index.html` 从 `reports.json` 读取索引并以年 → 月 → 卡片的层级渲染。整体风格：专业金融向、A 股红涨绿跌配色（红作强调、绿作辅色）、浅底护眼。

## 目录约定

- `index.html` — 首页，纯静态（HTML/CSS/JS，无构建）。修改样式与交互直接改这一个文件。
- `reports.json` — 复盘索引，**由脚本自动生成，不要手工编辑**。结构：`{ "reports": [ { date, title, path } ] }`。
- `reports/YYYY/MM/YYYY-MM-DD.html` — 每日复盘正文。文件名必须包含 `YYYY-MM-DD`，否则会被 `build-index.mjs` 跳过。
- `scripts/build-index.mjs` — 扫描 `reports/**/*.html`，从文件名解析日期、从 `<title>`（回退 `<h1>`）抓标题，输出 `reports.json`（按日期倒序）。零依赖，需 Node。
- `scripts/install-hooks.sh` — 写入 `.git/hooks/pre-commit`，让 commit 前自动重建 `reports.json` 并 `git add`。

## 日常发布流程

```bash
# 首次克隆后（仅一次）
bash scripts/install-hooks.sh

# 每日新增复盘
cp <生成好的复盘>.html reports/2026/08/2026-08-20.html
git add reports/2026/08/2026-08-20.html
git commit -m "add 2026-08-20 review"   # pre-commit 钩子自动重建并 add reports.json
git push
```

## 手动重建索引

```bash
node scripts/build-index.mjs
```

跳过日期无法解析的文件会打印到 stderr——如果日志中出现「跳过 N 个」，检查文件名是否含 `YYYY-MM-DD`。

## 修改注意事项

- **不要把 `reports.json` 加进 `.gitignore`**：Gitee Pages 靠它加载首页数据。它是生成物但必须入库。
- **不要在 `index.html` 里硬编码复盘列表**：所有列表数据来自 `reports.json`。
- git hooks 不入版本库是 git 的设计；新克隆环境要重新跑 `install-hooks.sh`。
- 若某天不方便装钩子，手动跑一次 `node scripts/build-index.mjs` 再提交即可，效果等价。
- 配色变量集中在 `index.html` 顶部 `:root` CSS 变量里（`--up` 红、`--down` 绿、`--accent` 深蓝）。改主题只改这里。
