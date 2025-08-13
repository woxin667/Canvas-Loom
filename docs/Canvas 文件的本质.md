Obsidian Canvas 有两种卡片：文本卡片和文档卡片。

当你在 Obsidian 中创建一个 Canvas 时，它实际上会生成一个 .canvas 文件。这个文件本质上是一个 JSON 文件，存储了 Canvas 中所有节点和连接的完整信息。让我通过一个例子来说明：

```json
{
  "nodes": [
    {
      "id": "abc123",
      "type": "text",
      "text": "这是一个文本卡片",
      "x": 100,
      "y": 200,
      "width": 250,
      "height": 150,
      "color": "red"
    },
    {
      "id": "def456",
      "type": "file",
      "file": "notes/my-note.md",
      "x": 400,
      "y": 200,
      "width": 300,
      "height": 200
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "fromNode": "abc123",
      "toNode": "def456",
      "fromSide": "right",
      "toSide": "left"
    }
  ]
}
```

这个 JSON 结构是 Obsidian 官方定义的格式，用于保存 Canvas 的所有数据。每当你移动一个卡片、改变它的大小、添加新的卡片或连接线时，Obsidian 都会更新这个 JSON 文件。

关键特性：Obsidian 在保存和加载 Canvas 文件时，会保留它不认识的字段。这意味着如果我们在节点数据中添加自定义字段（如 badge: "99" 或 cssclass: "important"），Obsidian 不会删除这些字段，它们会被原样保存在文件中。