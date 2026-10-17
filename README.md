# 个人作品集与前端 Demo

一个零依赖、零构建的静态站点，包含个人介绍页和一个可直接使用的任务清单小应用。

- 线上地址：`https://你的用户名.github.io/my-portfolio/`（部署后替换）
- 技术栈：HTML / CSS / 原生 JavaScript，部署在 GitHub Pages

## 目录结构

```
index.html     作品集首页
demo.html      任务清单 Demo
styles.css     全站样式（含响应式断点）
main.js        首页小交互（年份、复制邮箱）
demo.js        任务清单逻辑
assets/        图标与截图
```

## 本地预览

直接双击 `index.html` 就能看。也可以起一个本地服务，避免部分浏览器对 `file://` 的限制：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 上线前要替换的内容

| 占位内容 | 换成 |
| --- | --- |
| `张明` | 你的名字 |
| `ZM` | 你的名字缩写 |
| `your-username` | 你的 GitHub 用户名 |
| `zm@example.com` | 你的邮箱 |
| `上海` | 你所在的城市 |
| `前端开发` | 你的求职方向 |

替换方式：用编辑器的全局搜索替换（VS Code 里按 `Ctrl+Shift+H`），把上表里的占位内容逐个换掉。

## 实现要点

- 布局用 Grid 和 Flex 手写，断点在 900px / 720px / 640px，无 UI 框架。
- 任务清单用「改状态 -> 重绘」的单一数据流，事件监听挂在列表父级做事件委托。
- 用户输入统一用 `textContent` 写入，不拼 HTML 字符串，避免 XSS。
- 数据存 `localStorage` 并做了读写异常兜底，隐私模式下页面仍可使用。
- 筛选按钮用 `aria-pressed` 表达状态，复选框带可读标签，键盘可以完整操作。

## 部署

推送到 GitHub 后，在仓库 `Settings -> Pages` 里选择 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，保存后等一分钟即可。

## 第一次推送到 GitHub

```bash
# 1. 配置身份（只需一次，邮箱建议用 GitHub 账号邮箱）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 2. 提交
git add .
git commit -m "feat: 个人作品集与任务清单 Demo"

# 3. 关联远程仓库（先到 GitHub 网页新建同名空仓库 my-portfolio）
git remote add origin https://github.com/你的用户名/my-portfolio.git
git push -u origin main
```

推送时如果弹出登录窗口，选 `Sign in with your browser`，在浏览器里点授权即可。
