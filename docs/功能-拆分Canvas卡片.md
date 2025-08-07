# 功能：按分隔符拆分 Canvas 卡片

## 目标

实现一个功能，允许用户根据自定义的分隔符，将 Obsidian Canvas 中的单个文本卡片拆分成多个卡片。

## 实现细节

### 1. 命令注册

- **修改文件**: `src/main.ts`
- **逻辑**: 在用户右键点击 Canvas 中的节点时出现的上下文菜单中，添加一个新命令。
- **实现**: 我们使用 `this.registerEvent(this.app.workspace.on('canvas:node-menu', ...))` 来监听 Canvas 节点菜单的创建事件，并添加了一个新的菜单项“按分隔符拆分卡片”。

### 2. 核心拆分逻辑

- **修改文件**: `src/main.ts`
- **逻辑**: 当命令被触发时，执行以下步骤：
    1.  获取当前选中的 Canvas 节点。
    2.  确保该节点是文本节点且未处于编辑模式。
    3.  读取节点的文本内容。
    4.  使用插件设置中指定的分隔符来拆分文本内容。
    5.  为每个拆分后的文本片段创建一个新的文本节点。
    6.  新卡片被放置在原始卡片的右侧，并垂直排列。

### 3. 分隔符设置

- **修改文件**:
    - `src/interface/ICardifySettings.ts`
    - `src/class/CardifySettingTabClass.ts`
    - `src/main.ts`
- **逻辑**: 为了使功能更加灵活，分隔符由用户配置。
- **实现**:
    1.  在 `CardifySettings` 接口中添加了新属性 `canvasCardDelimiter`。
    2.  在 `main.ts` 的 `DEFAULT_SETTINGS` 对象中，为该属性设置了默认值 `'---'`。
    3.  在插件的设置页 (`CardifySettingTab`) 中，添加了一个新的文本输入框，允许用户更改分隔符。

### 4. 类型安全与错误处理

- **修改文件**: `src/main.ts`
- **逻辑**: 为了处理 TypeScript 的严格类型检查以及 Canvas 菜单的私有 API 可能带来的错误，我们进行了一些调整。
- **实现**:
    - `'canvas:node-menu'` 事件并非公共 API 的一部分，因此我们使用 `// @ts-ignore` 来抑制 TypeScript 编译错误。
    - `menu` 和 `node` 参数被显式地声明为 `any` 类型，以避免在编译时出现隐式 `any` 类型的错误。
