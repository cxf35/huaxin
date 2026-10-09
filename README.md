# 许申杰 ❤ 华星・表白站

一个基于 [Flowtime](https://github.com/marcolago/flowtime.js) 的 55 页图文表白网站，讲述 "许申杰 ❤ 华星，一生一世" 的故事。

在线地址：[https://xsj.woaihua.xin/](https://xsj.woaihua.xin/)

## ✨ 功能特性

**55 页图文故事**



* 9 个 section、55 个页面，图片 + 文字翻页浏览

* 支持背景音乐（进入后自动播放）

**电脑端操作**



* `↓` / `→` / 空格：下一页

* `↑` / `←`：上一页

* `Esc`：进入 / 退出 Overview 缩略图视图

* 右下角缩略图进度条，点击可跳转

**手机端操作（竖屏专属适配）**



* **上滑 / 下滑**：翻页

* **双击屏幕**：瞬间进入爱心排列（55 张缩略图排成心形，不会闪现原生网格）

* **按住缩略图**：该图平滑放大到屏幕中间预览

* **手指滑动**：滑动到哪个缩略图，哪个就放大预览

* **松手**：全屏进入该页面

* **手指移到爱心外（粉色渐变区域）松手**：取消预览，留在爱心排列，不进入全屏

* **双击**：退出爱心排列

* 左下角 **9:16 竖块进度条**，自动换行多列

**手机端视觉适配**



* 爱心外背景为温馨粉色渐变（`#fff0f5 → #ffd9e8 → #ffc2d1`）

* 十余个页面在手机端自动替换为 9:16 竖版图片（`<picture>` 双图，电脑端保持原图不变）

* 文字大小、位置按手机端单独微调

## 📁 目录结构



```
├── index.html          # 主页（55 页内容 + 双图适配）
├── css/
│   └── all.min.css     # 样式（尾部含手机端 portrait 适配块）
├── js/
│   ├── flowtime.js     # Flowtime 翻页框架
│   ├── mobile.js       # 手机端核心：爱心排列 + 触摸交互
│   ├── love.min.js     # 站点脚本
│   └── ...
├── img/                # 页面图片（iali*.jpg 等，含手机端竖版图）
├── fonts/
│   └── RuiHeiXiTi.otf  # 标题字体
├── music/
│   └── saveme.mp3      # 背景音乐
└── README.md
```

## 🚀 本地运行

项目为纯静态站点，任意静态服务器均可运行：



```
# 在项目目录下
python -m http.server 8765
```

浏览器访问 [http://127.0.0.1:8765/](http://127.0.0.1:8765/)（手机同局域网访问 `http://<电脑IP>:8765/`）。

## 🌐 部署



* **GitHub Pages**：仓库 Settings → Pages → Source 选择 `main` 分支即可

* **Vercel / Netlify**：导入仓库，构建命令留空，输出目录留空

* 或任意静态托管服务

## 🛠 维护提示



* 手机端逻辑集中在 `js/mobile.js`，样式集中在 `css/all.min.css` 尾部的

  `@media screen and (max-width: 768px) and (orientation: portrait)` 块

* 修改 `mobile.js` 后，请同步 `index.html` 中的引用版本号

  （`js/mobile.js?v=N`，N 递增），强制手机浏览器刷新缓存

* 修改 `all.min.css` 后同理，同步 `css/all.min.css?v=N`

## 💝

愿每一个用心准备的表白，都能被温柔回应。