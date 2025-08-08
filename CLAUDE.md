# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在处理此存储库中的代码时提供指导。处理时使用中文。

## 项目概览

这是一个 Obsidian 插件，为 Obsidian Canvas 添加了拆分卡片、复制卡片内容以及为卡片添加数字徽章的功能。用户可以根据自定义的分隔符将文本卡片拆分成多个卡片，也可以复制单个或多个卡片的内容到剪贴板，还可以为卡片添加数字、文字或 emoji 徽章以标识状态或优先级。

## 常用开发命令

- `npm run dev` - 启动开发模式，包含文件监控和自动重新构建
- `npm run build` - 为生产环境构建插件 (输出至 `build/main.js`)
- `npm run version` - 更新 `manifest.json` 和 `versions.json` 中的版本号

## 代码架构

### 主要插件文件
- `src/main.ts` - 包含核心插件逻辑，包括：
    - Canvas 节点右键菜单的事件注册
    - 根据分隔符创建新节点的卡片分割算法
    - 单个和多个卡片内容复制功能
    - 卡片徽章的添加/编辑/移除功能
    - 设置管理与持久化

### 工具函数
- `src/utils/clipboardUtils.ts` - 包含剪贴板操作相关的工具函数

### 设置
- `src/interface/ICardifySettings.ts` - 定义插件设置的 TypeScript 接口
- `src/class/CardifySettingTabClass.ts` - 插件设置页面的 UI 组件

### 构建系统
- `esbuild.config.mjs` - 使用 esbuild 的构建配置
- `tsconfig.json` - TypeScript 编译器配置
- `manifest.json` - Obsidian 插件清单文件

### 关键实现细节
1. 插件监听 'canvas:node-menu' 和 'canvas:selection-menu' 事件以新增右键菜单项
2. 被触发时，它会根据情况提供以下功能：
   - 使用用户定义的分隔符来分割 Canvas 文本节点的内容
   - 复制单个卡片的文本内容到剪贴板
   - 复制多个卡片的内容到剪贴板（按空间位置排序）
   - 为卡片添加/编辑/移除数字徽章
3. 新卡片会以固定的尺寸创建，并垂直排列在原始卡片的右侧
4. 徽章信息存储在卡片关联笔记的 Frontmatter 中
5. 徽章显示通过 CSS 伪元素实现，支持数字、文字和 emoji 类型
6. 设置会使用 Obsidian 内置的数据加载/保存机制进行持久化

## 文档管理

### 核心功能

关于核心功能的详细信息，请参阅以下文档：

- **[功能：按分隔符拆分 Canvas 卡片](./docs/功能-拆分Canvas卡片.md)**
- **[功能：卡片内容复制与排序](./docs/功能-卡片内容复制与排序.md)**
- **[功能：新 Canvas 卡片的尺寸调整](./docs/功能-Canvas卡片尺寸调整.md)**
- **[功能：为 Canvas 卡片添加/移除数字徽章](./docs/功能-卡片徽章.md)**

### 技术实现

关于项目技术实现的详细信息，请参阅：

- **[项目技术实现细节](./docs/技术实现细节.md)**

### 功能变更与迭代

关于项目重构和功能变更的详细说明，请参阅：

- **[项目重构与功能变更说明](./docs/项目重构和功能变更说明.md)**

### 项目编码规则

- 每次对项目进行改动后，都应主动询问是否需要更新或创建 `docs` 目录下的相关文档，以确保文档的同步和准确性。

### 测试

将测试文件放在`./text`路径下