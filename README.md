# 海底物理世界 · Seafloor World

按真实地点和实测数据搭建的三维海底世界：从 10 m 的珊瑚礁，一路下潜到 10,935 m 的马里亚纳海沟底。直接在浏览器里运行，不需要安装任何东西。

A real-time 3D ocean built from real sites and measured data, from a 10 m coral reef down to the 10,935 m Challenger Deep. Runs in any modern browser (WebGL); the interface is in Chinese.

**在线体验：<https://4jt8jty9sk-cpu.github.io/seafloor-world/>**（第一次打开可以先点“看 6 分钟展览导览”）

## 项目文档

- [项目总结](docs/PROJECT.md)：目标、场景一览、物理模型、功能、技术结构、已知限制和下一步
- [更新记录](docs/CHANGELOG.md)：23 次更新，逐项说明加了什么
- [路线图](docs/ROADMAP.md)
- [资料来源](docs/SOURCES.md)：41 条参考资料

## 能看什么

- **十几个真实地点**：南海西沙珊瑚礁、蒙特雷巨藻林、特鲁克沉船、南极海冰之下、三亚珊瑚产卵之夜、挪威冷水珊瑚礁、海马冷泉、墨西哥湾海底盐池、蒙特雷峡谷鲸落、龙旂热液区、三沙永乐龙洞、北太平洋昼夜垂直迁移，以及关岛 → 马里亚纳海沟全程下潜和“重走 2012 深海挑战者号”。
- **按物理计算**：光在水中按波长衰减（Beer–Lambert）、波浪与海流、压强、深海声道（SOFAR）声线、昼夜垂直迁移、生物发光的剪切应力阈值等，参数和来源都写在页面的“更新记录、路线图与资料来源”里。
- **玩法**：展览模式（约 6 分钟自动导览）、自由驾驶水下机器人、探险任务、图鉴、全球海底地形图、压力实验、明信片、手机分屏 VR 与 WebXR 头显模式。

## 在本地运行

页面会加载 `data/` 和 `src/` 下的文件，所以要通过本地服务器打开，不能直接双击 `index.html`：

```bash
python3 -m http.server 8000
# 然后在浏览器打开 http://localhost:8000
```

## 发布到 GitHub Pages

仓库是纯静态文件，不需要构建。在 GitHub 仓库页面进入 **Settings → Pages**，“Build and deployment” 的 Source 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。一两分钟后网址会出现在同一页面顶部，通常是 `https://<用户名>.github.io/seafloor-world/`。

## 目录结构

```
index.html            页面结构与界面文字
css/style.css         样式
src/main.js           三维场景、物理模型和全部交互（three.js r128）
data/etopo20.js       全球地形数据（ETOPO 20 角分，8 位量化）
tools/build_single.py 把以上文件合并成一个独立 HTML（用于发布到 Claude）
narration/tour.json   展览模式的语音讲解词
tools/gen_tts.py      调用 MiniMax 生成讲解音频（由 GitHub Actions 运行）
audio/tour/           生成好的讲解音频
```

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
