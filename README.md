# Canvas Card Actions

`Canvas Card Actions` 是一个 Obsidian Canvas 增强插件，聚焦四类高频操作：

- 拆分单张文本卡片
- 复制、拼合和预览多张卡片内容
- 为卡片添加徽章
- 查看和调整卡片属性

当前版本：`1.3.0`

## 功能概览

- `拆分卡片...`
  支持按自定义分隔符或 Markdown 标题层级拆分。
- `复制卡片内容`
  复制单张文本卡片的纯文本内容。
- `一键复制` / `一键拼合`
  按设置中的默认排序方式处理多张卡片。
- `打开预览...`
  在工作台中切换排序、预览结果，并输出为剪贴板、Canvas 卡片或 Markdown 文稿。
- `添加/编辑徽章`
  支持数字、文字和 emoji 徽章。
- `管理卡片属性`
  统一处理单卡片查看和多卡片批量尺寸调整。

## 插件设置

- `设置Canvas卡片分隔符`：控制分隔符拆分使用的文本
- `设置卡片排序优先级`：控制位置排序优先按纵向还是横向
- `一键排序方式`：控制一键复制、一键拼合和工作台默认排序模式
- `启用徽章功能`：控制是否显示卡片徽章

## 安装

### 从 GitHub Releases 安装

1. 打开本仓库的 [Releases](https://github.com/Worthing667/Obsidian-Canvas-Card-Actions/releases)
2. 下载 `obsidian-canvas-card-actions-x.y.z.zip`
3. 将 `main.js`、`manifest.json`、`styles.css` 放入 `.obsidian/plugins/obsidian-canvas-card-actions/`
4. 在 Obsidian 中启用插件

### 本地构建

```bash
npm install
npm run build
```

## 开发

- `npm run dev`：开发模式
- `npm run build`：生产构建
- `npm run version`：同步更新版本号

## 文档

文档索引见 [docs/README.md](./docs/README.md)。

建议优先阅读：

- `docs/功能-拆分Canvas卡片.md`
- `docs/功能-卡片内容复制与排序.md`
- `docs/功能-卡片徽章.md`
- `docs/功能-查看和编辑卡片属性.md`
- `docs/技术实现细节.md`

## 致谢

早期开发参考了 **joshuakto** 的开源项目 [obsidian-cardify](https://github.com/joshuakto/obsidian-cardify)。
