# Obsidian Canvas功能增强 插件

## 项目概览

这是一个 Obsidian 插件，它增强了 Canvas 的功能，主要包括：
1.  **卡片拆分**：根据自定义分隔符，将一个文本卡片拆分为多个。
2.  **卡片徽章**：为卡片添加可自定义的、持久化的徽章，用于状态或优先级标记。

该插件通过为 Canvas 节点添加右键菜单项来提供这些功能。

## 常用开发命令

- `npm run dev` - 启动开发模式，包含文件监控和自动重新构建
- `npm run build` - 为生产环境构建插件 (输出至 `build/main.js`)
- `npm run version` - 更新 `manifest.json` 和 `versions.json` 中的版本号

## 代码架构

### 主要插件文件
- `src/main.ts` - 包含核心插件逻辑，包括：
    - Canvas 节点右键菜单的事件注册
    - 卡片分割算法
    - **徽章功能的实现，包括数据读写和持久化**
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
1. **事件监听**: 插件通过 `canvas:node-menu` 和 `canvas:selection-menu` 事件来向 Canvas 添加右键菜单项。
2. **卡片拆分**: 使用用户定义的分隔符来分割 Canvas 文本节点的内容，并创建新卡片。
3. **徽章持久化**:
    - 利用了 **Canvas 文件会保留未知字段**的特性。
    - 当用户添加徽章时，插件通过 `canvas.getData()` 获取数据，将徽章信息（如 `badge`）作为新字段添加到节点的 JSON 数据中。
    - 通过 `canvas.setData()` 和 `canvas.requestSave()` 将更新后的数据写回 `.canvas` 文件，从而实现持久化。
4. **徽章加载**: 插件启动或打开 Canvas 文件时，会读取节点数据中的自定义徽章字段，并将其应用到对应的 DOM 元素上以供显示。
5. **设置持久化**: 插件的常规设置（如分隔符）使用 Obsidian 内置的 `loadData()` 和 `saveData()` 机制进行持久化。

## 文档管理

### 核心功能

关于核心功能的详细信息，请参阅以下文档：

- **[功能：卡片内容复制与排序](./docs/功能-卡片内容复制与排序.md)**
- **[功能：按分隔符拆分 Canvas 卡片](./docs/功能-拆分Canvas卡片.md)**
- **[功能：新 Canvas 卡片的尺寸调整](./docs/功能-Canvas卡片尺寸调整.md)**
- **[功能：为 Canvas 卡片添加/移除数字徽章](./docs/功能-卡片徽章.md)**

### 技术实现

关于项目技术实现的详细信息，请参阅：

- **[技术实现：卡片复制与排序](./docs/技术实现-卡片复制与排序.md)**
- **[技术实现：卡片徽章](./docs/技术实现-卡片徽章.md)**
- **[项目技术实现细节](./docs/技术实现细节.md)**

### 功能变更与迭代

关于项目重构和功能变更的详细说明，请参阅：

- **[项目重构与功能变更说明](./docs/项目重构和功能变更说明.md)**

### 项目编码规则

- 每次对项目进行改动后，都应主动询问是否需要更新或创建 `docs` 目录下的相关文档，以确保文档的同步和准确性。