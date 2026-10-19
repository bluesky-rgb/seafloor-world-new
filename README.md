# 海底物理世界 · Seafloor World

按真实地点和实测数据搭建的三维海底世界：从 10 m 的珊瑚礁，一路下潜到 10,935 m 的马里亚纳海沟底。直接在浏览器里运行，不需要安装任何东西。

A real-time 3D ocean built from real sites and measured data, from a 10 m coral reef down to the 10,935 m Challenger Deep. Runs in any modern browser (WebGL); the interface is in Chinese.

**在线体验：<https://4jt8jty9sk-cpu.github.io/seafloor-world/>**（第一次打开可以先点“看 8 分钟展览导览”）

## 项目文档

- **[项目总览（网页）](https://4jt8jty9sk-cpu.github.io/seafloor-world/overview.html)**：研究思路、地点深度剖面、物理模型、技术架构、开发时间线、遗留问题、可扩展方向和可搜索的资料库
- [项目总结](docs/PROJECT.md)：目标、场景一览、物理模型、功能、技术结构、已知限制和下一步
- [技术实现说明](docs/ARCHITECTURE.md)：代码结构、渲染与水下光学、主循环、各功能实现、语音讲解流程、性能、开发流程
- [更新记录](docs/CHANGELOG.md)：31 次更新，逐项说明加了什么
- [路线图](docs/ROADMAP.md)
- [资料来源](docs/SOURCES.md)：68 条参考资料

## 能看什么

- **19 个真实地点**：南海西沙珊瑚礁、海南陵水海草床与红树林、浙江南麂列岛岩礁潮间带（可播放潮汐）、蒙特雷巨藻林、特鲁克沉船、南极海冰之下、北极浮冰边缘（一角鲸与白鲸）、三亚珊瑚产卵之夜、挪威冷水珊瑚礁、海马冷泉、墨西哥湾海底盐池、蒙特雷峡谷鲸落、龙旂热液区、戴维森海山章鱼花园、太平洋深海平原（锰结核与 1979 年采矿车辙）、三沙永乐龙洞、北太平洋昼夜垂直迁移，以及关岛 → 马里亚纳海沟全程下潜和“重走 2012 深海挑战者号”。
- **按物理计算**：光在水中按波长衰减（Beer–Lambert）、波浪与海流、压强、深海声道（SOFAR）声线、昼夜垂直迁移、生物发光的剪切应力阈值等，参数和来源都写在页面的“更新记录、路线图与资料来源”里。
- **玩法**：展览模式（约 8 分钟自动导览，带 MiniMax 语音讲解）、自由驾驶水下机器人、探险任务、图鉴、全球海底地形图、压力实验、明信片、手机分屏 VR 与 WebXR 头显模式。

## 在本地运行

页面会加载 `js/`、`data/`、`audio/` 下的文件，所以要通过本地服务器打开，不能直接双击 `index.html`：

```bash
python3 -m http.server 8000
# 然后在浏览器打开 http://localhost:8000
```

## 发布到 GitHub Pages

仓库是纯静态文件。在 GitHub 仓库页面进入 **Settings → Pages**，“Build and deployment” 的 Source 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。推送到 `main` 后一两分钟网站自动更新。

## 目录结构

```
index.html            页面结构与全部界面文字
css/style.css         样式
src/NN-*.js           程序源码，按功能分成 38 个文件（渲染、水下光学、生物、各地点、实验、导览……）
js/seafloor.js        由 src/ 拼接生成、页面实际加载的脚本（不要手改）
data/etopo20.js       全球地形数据（ETOPO 20 角分，8 位量化），打开地图时才加载
narration/tour.json   展览模式的语音讲解词
audio/tour/           MiniMax 生成的讲解音频
assets/               分享预览图与网站图标
tools/                构建、检查、配音生成、文档同步脚本
docs/                 项目文档
.github/workflows/    自动检查与配音生成
```

## 修改代码

改 `src/` 下的文件，然后：

```bash
python3 tools/build.py      # 生成 js/seafloor.js 并检查语法
python3 tools/stamp.py      # 更新 index.html 里的版本标记，让浏览器取到新文件
python3 tools/check.py      # 提交前总检查（推送后 GitHub 也会自动跑）
python3 tools/smoke_test.py # 可选：用无头浏览器把主要功能点一遍（需安装 playwright）
```

代码是怎么组织的、每一帧做了什么、各个物理效果怎么实现、怎样加新地点和新生物，见 [技术实现说明](docs/ARCHITECTURE.md)。

## 数据与限制

- 全球地形来自 NOAA ETOPO（20 角分版本，取自 matplotlib/basemap 示例数据），网格约 37 km，所以地图上马里亚纳海沟只有约 9,000 m 深，真实最深处为 10,935 m。
- 鱼群、水流等是简化模型；为了看得清，部分东西（气泡、珊瑚卵精束等）做了放大。所有放大和简化都在页面的规则说明里写明。
- 在 Claude 里打开的版本有“所有访客共享的图鉴”；独立网站版本的图鉴和任务进度只保存在访问者自己的浏览器里。

## 导览语音讲解（MiniMax）

展览模式的讲解词在 `narration/tour.json`。配音由 GitHub Actions 调用 MiniMax 语音合成生成，存到 `audio/tour/`，网页只播放这些音频文件，**API 密钥不会出现在网页或仓库里**。还没有生成音频时，导览只显示字幕，不会用机器朗读代替。

第一次使用：

1. 仓库 **Settings → Secrets and variables → Actions → Secrets**，新建 `MINIMAX_API_KEY`，填 MiniMax 的 API 密钥。
2. （可选）同一页的 **Variables** 里可以设置：
   - `MINIMAX_API_HOST`：国内账号用默认的 `https://api.minimax.cn`；国际账号（minimax.io）填 `https://api.minimax.io`
   - `MINIMAX_VOICE_ID`：音色，默认 `Chinese (Mandarin)_Male_Announcer`
   - `MINIMAX_MODEL`：默认 `speech-2.8-hd`；`MINIMAX_SPEED`：语速，默认 `0.95`
3. **Actions → 生成导览配音 → Run workflow**。几分钟后音频会自动提交到仓库，网站随后更新。

以后修改 `narration/tour.json` 并提交，会自动只重新生成改动过的句子。

## 第三方库

- [three.js](https://threejs.org/) r128（MIT 许可），从 CDN 加载。
