import { App, Modal, Notice } from "obsidian";
import { CardService } from "../../services/CardService";
import { ClipboardAdapter } from "../../adapters/ClipboardAdapter";
import { PositionSortStrategy } from "../../domain/strategies/PositionSort";
import { validateDimension } from "../../utils/dimensionUtils";
import type { CanvasNode, DimensionStats } from "../../types/canvas";

interface CardInfo {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  text: string;
  hasBadge: boolean;
  badgeContent?: string;
}

export class CardPropertiesModal extends Modal {
  private cards: CanvasNode[];
  private cardService: CardService;
  private cardInfos: CardInfo[] = [];
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;
  private aspectToggle: HTMLInputElement;

  constructor(app: App, cards: CanvasNode[], cardService: CardService) {
    super(app);
    this.cards = cards;
    this.cardService = cardService;
    this.processCardData();
  }

  private processCardData(): void {
    this.cardInfos = this.cards.map(card => {
      const data = card.getData();
      const textPreview = data.text ? 
        (data.text.length > 40 ? data.text.substring(0, 40) + "..." : data.text) : "";
      
      return {
        id: data.id,
        width: data.width,
        height: data.height,
        x: data.x,
        y: data.y,
        text: textPreview,
        hasBadge: !!data.badge,
        badgeContent: data.badge
      };
    });

    // 按位置排序（从上到下，从左到右）
    const sorter = new PositionSortStrategy('yx', 10);
    this.cardInfos = sorter.sort(this.cardInfos);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("canvas-loom-card-properties-modal");
    
    // 标题
    contentEl.createEl("h2", { text: "管理卡片属性" });
    
    // 统计信息
    this.createStatisticsSection(contentEl);
    
    // 卡片列表 - 删除了"预览"标题
    this.createCardList(contentEl);
    
    // 批量操作区域 - 只有在多卡片时才显示
    if (this.cardInfos.length > 1) {
      this.createBatchActions(contentEl);
    }
    
    // 复制功能区域
    this.createCopySection(contentEl);
    
  }

  private createStatisticsSection(container: HTMLElement): void {
    const stats = this.calculateStatistics();
    
    // 创建统计信息区域
    const statsSection = container.createDiv({ cls: "cca-stats-section" });
    const statsGrid = statsSection.createDiv({ cls: "cca-grid-cols-3" });
    
    // 选中卡片数量
    const countItem = statsGrid.createDiv({ cls: "cca-stat-item" });
    countItem.createDiv({ cls: "cca-stat-label", text: "选中卡片" });
    countItem.createDiv({ cls: "cca-stat-value highlight", text: String(stats.count) });
    countItem.createDiv({ cls: "cca-stat-detail", text: "张卡片" });
    
    // 尺寸范围
    const sizeItem = statsGrid.createDiv({ cls: "cca-stat-item" });
    sizeItem.createDiv({ cls: "cca-stat-label", text: "尺寸范围" });
    sizeItem.createDiv({ cls: "cca-stat-value", text: `${stats.avgWidth}×${stats.avgHeight}` });
    const sizeDetail = sizeItem.createDiv({ cls: "cca-stat-detail" });
    sizeDetail.createDiv({ text: `宽 ${stats.minWidth}-${stats.maxWidth}px` });
    sizeDetail.createDiv({ text: `高 ${stats.minHeight}-${stats.maxHeight}px` });
    
    // 位置范围
    const positionItem = statsGrid.createDiv({ cls: "cca-stat-item" });
    positionItem.createDiv({ cls: "cca-stat-label", text: "位置范围" });
    positionItem.createDiv({ cls: "cca-stat-value", text: `X: ${stats.minX}-${stats.maxX}` });
    positionItem.createDiv({ cls: "cca-stat-detail", text: `Y: ${stats.minY}-${stats.maxY}` });
  }

  private createCardList(container: HTMLElement): void {
    // 删除了"预览"标题，直接创建表格
    
    // 创建表格容器
    const tableContainer = container.createDiv({ cls: "table-container" });
    
    // 创建表格
    const table = tableContainer.createEl("table");
    
    // 创建表头
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    
    headerRow.createEl("th", { text: "#", cls: "col-index" });
    headerRow.createEl("th", { text: "预览", cls: "col-preview" });
    headerRow.createEl("th", { text: "尺寸", cls: "col-size" });
    headerRow.createEl("th", { text: "位置", cls: "col-position" });
        headerRow.createEl("th", { text: "标记", cls: "col-badge" });
    
    // 创建表体
    const tbody = table.createEl("tbody");
    
    // 创建卡片项
    this.cardInfos.forEach((info, index) => {
      const row = tbody.createEl("tr");
      
      // 索引
      row.createEl("td", { text: (index + 1).toString(), cls: "col-index" });
      
      // 文本预览
      const previewCell = row.createEl("td", { cls: "col-preview" });
      const previewSpan = previewCell.createEl("span", { 
        cls: "preview-text",
        text: info.text || "[空]"
      });
      previewSpan.setAttribute("title", info.text || "空卡片");
      
      // 尺寸
      row.createEl("td", { text: `${info.width}×${info.height}`, cls: "col-size" });
      
      // 位置
      row.createEl("td", { text: `${info.x},${info.y}`, cls: "col-position" });
      
      // 标记
      const badgeCell = row.createEl("td", { cls: "col-badge" });
      if (info.hasBadge) {
        badgeCell.createEl("span", { 
          cls: "layer-badge",
          text: info.badgeContent || ""
        });
      } else {
        badgeCell.createEl("span", { text: "-" });
      }
    });
  }

  private createBatchActions(container: HTMLElement): void {
    // 创建操作区域容器 - 改为双栏布局
    const operationsContainer = container.createDiv({ cls: "operations-container" });
    
    // 批量操作组 - 左栏
    const operationGroup = operationsContainer.createDiv({ cls: "cca-stats-section" });
    operationGroup.createEl("h3", { cls: "cca-section-title", text: "批量操作" });
    
    // 创建按钮组容器
    const buttonGroup = operationGroup.createDiv({ cls: "button-group" });
    
    // 统一为最小尺寸按钮
    const minSizeBtn = buttonGroup.createEl("button", { 
      text: "统一为最小尺寸", 
      cls: "btn-option active" 
    });
    minSizeBtn.addEventListener("click", () => {
      this.updateButtonStates(minSizeBtn, buttonGroup);
      void this.unifyToSize("min");
    });
    
    // 统一为最大尺寸按钮
    const maxSizeBtn = buttonGroup.createEl("button", { 
      text: "统一为最大尺寸", 
      cls: "btn-option" 
    });
    maxSizeBtn.addEventListener("click", () => {
      this.updateButtonStates(maxSizeBtn, buttonGroup);
      void this.unifyToSize("max");
    });
    
    // 统一为平均尺寸按钮
    const avgSizeBtn = buttonGroup.createEl("button", { 
      text: "统一为平均尺寸", 
      cls: "btn-option" 
    });
    avgSizeBtn.addEventListener("click", () => {
      this.updateButtonStates(avgSizeBtn, buttonGroup);
      const stats = this.calculateStatistics();
      void this.unifyToCustomSize(stats.avgWidth, stats.avgHeight);
    });
    
    // 自定义尺寸操作组 - 右栏
    const customSizeGroup = operationsContainer.createDiv({ cls: "cca-stats-section" });
    customSizeGroup.createEl("h3", { cls: "cca-section-title", text: "自定义尺寸" });
    
    // 创建紧凑的自定义输入区域
    const sizeInputs = customSizeGroup.createDiv({ cls: "size-inputs-compact" });
    
    // 宽度输入组
    const widthGroup = sizeInputs.createDiv({ cls: "input-compact" });
    widthGroup.createEl("label", { text: "宽", cls: "input-label-compact" });
    this.widthInput = widthGroup.createEl("input", {
      type: "number",
      value: "",
      attr: { min: "50", max: "2000", placeholder: "留空不变" }
    });
    
    // 高度输入组
    const heightGroup = sizeInputs.createDiv({ cls: "input-compact" });
    heightGroup.createEl("label", { text: "高", cls: "input-label-compact" });
    this.heightInput = heightGroup.createEl("input", {
      type: "number", 
      value: "",
      attr: { min: "50", max: "2000", placeholder: "留空不变" }
    });

    // 锁定宽高比控制
    const aspectToggleDiv = customSizeGroup.createDiv({ cls: "aspect-ratio-toggle" });
    this.aspectToggle = aspectToggleDiv.createEl("input", {
      type: "checkbox"
    });
    aspectToggleDiv.createSpan({ text: "锁定宽高比（等比例调整）" });

    // 初始化宽高比（使用当前选中卡片的平均宽高比）
    const stats = this.calculateStatistics();
    const aspectRatio = stats.avgWidth / stats.avgHeight;

    // 设置初始输入框状态
    this.setupAspectRatioLogic(aspectRatio);

    // 回车键支持
    [this.widthInput, this.heightInput].forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          void this.applyCustomSize();
        }
      });
    });
    
    // 添加事件监听器，根据按钮选择自动填充自定义尺寸
    minSizeBtn.addEventListener("click", () => {
      const stats = this.calculateStatistics();
      this.widthInput.value = stats.minWidth.toString();
      this.heightInput.value = stats.minHeight.toString();
    });
    
    maxSizeBtn.addEventListener("click", () => {
      const stats = this.calculateStatistics();
      this.widthInput.value = stats.maxWidth.toString();
      this.heightInput.value = stats.maxHeight.toString();
    });
    
    avgSizeBtn.addEventListener("click", () => {
      const stats = this.calculateStatistics();
      this.widthInput.value = stats.avgWidth.toString();
      this.heightInput.value = stats.avgHeight.toString();
    });
  }

  private setupAspectRatioLogic(initialAspectRatio: number): void {
    let aspectRatio = initialAspectRatio;

    // 宽高比锁定逻辑
    this.aspectToggle.addEventListener("change", () => {
      if (this.aspectToggle.checked) {
        const width = this.widthInput.value ? parseInt(this.widthInput.value) : null;
        const height = this.heightInput.value ? parseInt(this.heightInput.value) : null;
        
        if (width && height && height !== 0) {
          aspectRatio = width / height;
        } else if (!width && !height) {
          // 如果两个都为空，使用平均宽高比
          const stats = this.calculateStatistics();
          aspectRatio = stats.avgWidth / stats.avgHeight;
        }
      }
    });

    // 宽度输入监听器
    this.widthInput.addEventListener("input", () => {
      if (this.aspectToggle.checked) {
        const width = parseInt(this.widthInput.value);
        if (!isNaN(width) && width > 0) {
          const newHeight = Math.round(width / aspectRatio);
          this.heightInput.value = newHeight.toString();
        } else if (this.widthInput.value === "") {
          // 如果宽度被清空，也清空高度
          this.heightInput.value = "";
        }
      }
    });

    // 高度输入监听器
    this.heightInput.addEventListener("input", () => {
      if (this.aspectToggle.checked) {
        const height = parseInt(this.heightInput.value);
        if (!isNaN(height) && height > 0) {
          const newWidth = Math.round(height * aspectRatio);
          this.widthInput.value = newWidth.toString();
        } else if (this.heightInput.value === "") {
          // 如果高度被清空，也清空宽度
          this.widthInput.value = "";
        }
      }
    });
  }
  
  // 辅助方法：更新按钮状态
  private updateButtonStates(activeButton: HTMLElement, container: HTMLElement): void {
    // 移除同组其他按钮的active类
    const buttons = container.querySelectorAll('.btn-option');
    buttons.forEach(button => {
      button.classList.remove('active');
    });
    
    // 为点击的按钮添加active类
    activeButton.classList.add('active');
  }

  private createCopySection(container: HTMLElement): void {
    // 创建底部操作
    const actionFooter = container.createDiv({ cls: "cca-action-footer" });
    
    // 复制所有卡片的尺寸信息
    const copyAllSizesBtn = actionFooter.createEl("button", {
      text: "复制所有卡片尺寸",
      cls: "cca-btn cca-btn-secondary"
    });
    
    copyAllSizesBtn.addEventListener("click", () => {
      const sizeList = this.cardInfos.map((card, index) => 
        `${index + 1}. ${card.width} × ${card.height} px`
      ).join('\n');
      
      const sizeInfo = `批量卡片尺寸 (${this.cardInfos.length}张):\n${sizeList}`;
      const clipboardAdapter = new ClipboardAdapter();
      void clipboardAdapter.writeTextWithNotice(sizeInfo, "所有卡片尺寸已复制到剪贴板");
    });

    // 复制统计信息
    const copyStatsBtn = actionFooter.createEl("button", {
      text: "复制统计信息",
      cls: "cca-btn cca-btn-info"
    });
    
    copyStatsBtn.addEventListener("click", () => {
      const stats = this.calculateStatistics();
      const statsInfo = `卡片统计信息:
数量: ${stats.count}张   
尺寸范围: 宽 ${stats.minWidth}-${stats.maxWidth}px, 高 ${stats.minHeight}-${stats.maxHeight}px  
平均尺寸: ${stats.avgWidth} × ${stats.avgHeight}px
位置范围: X: ${stats.minX}-${stats.maxX}, Y: ${stats.minY}-${stats.maxY}`;

      const clipboardAdapter = new ClipboardAdapter();
      void clipboardAdapter.writeTextWithNotice(statsInfo, "统计信息已复制到剪贴板");
    });

    // 应用更改按钮
    const applyBtn = actionFooter.createEl("button", {
      text: "应用更改",
      cls: "cca-btn cca-btn-primary"
    });
    
    applyBtn.addEventListener("click", () => {
      void this.applyCustomSize();
    });
  }

  private calculateStatistics(): DimensionStats {
    const widths = this.cardInfos.map(c => c.width);
    const heights = this.cardInfos.map(c => c.height);
    const xPositions = this.cardInfos.map(c => c.x);
    const yPositions = this.cardInfos.map(c => c.y);
    
    return {
      count: this.cardInfos.length,
      minWidth: Math.min(...widths),
      maxWidth: Math.max(...widths),
      avgWidth: Math.round(widths.reduce((a, b) => a + b, 0) / widths.length),
      minHeight: Math.min(...heights),
      maxHeight: Math.max(...heights),
      avgHeight: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length),
      minX: Math.min(...xPositions),
      maxX: Math.max(...xPositions),
      minY: Math.min(...yPositions),
      maxY: Math.max(...yPositions)
    };
  }

  private async unifyToSize(size: "min" | "max"): Promise<void> {
    try {
      await this.cardService.unifyCardSizes(this.cards, size);
      this.close();
    } catch (error) {
      console.error("统一尺寸失败:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice("统一尺寸失败: " + message);
    }
  }

  private async unifyToCustomSize(width: number, height: number): Promise<void> {
    try {
      await this.cardService.unifyCardSizes(this.cards, { width, height });
      new Notice(`已将所有卡片统一为 ${width}×${height}`);
      this.close();
    } catch (error) {
      console.error("统一尺寸失败:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice("统一尺寸失败: " + message);
    }
  }

  private async applyCustomSize(): Promise<void> {
    const widthValue = this.widthInput.value.trim();
    const heightValue = this.heightInput.value.trim();
    
    let width = widthValue ? parseInt(widthValue) : null;
    let height = heightValue ? parseInt(heightValue) : null;
    
    // 如果锁定宽高比，使用等比例调整逻辑
    if (this.aspectToggle.checked) {
      let aspectRatio: number;
      
      // 如果两个值都有，使用当前比例
      if (width && height) {
        aspectRatio = width / height;
      } else {
        // 否则使用选中卡片的平均宽高比
        const stats = this.calculateStatistics();
        aspectRatio = stats.avgWidth / stats.avgHeight;
      }
      
      if (width && !height) {
        // 只输入了宽度，计算高度
        height = Math.round(width / aspectRatio);
        this.heightInput.value = height.toString();
      } else if (height && !width) {
        // 只输入了高度，计算宽度
        width = Math.round(height * aspectRatio);
        this.widthInput.value = width.toString();
      } else if (!width && !height) {
        new Notice("请至少输入宽度或高度中的一个值");
        return;
      }
      
      // 验证计算后的值
      if (!width || !height || !this.validateDimension(width) || !this.validateDimension(height)) {
        new Notice("计算得出的尺寸值超出有效范围（50-2000像素）");
        return;
      }
      
      // 等比例调整所有卡片
      await this.unifyToCustomSize(width, height);
    } else {
      // 未锁定宽高比，支持单维度调整
      if (width && height) {
        // 同时输入宽度和高度：统一所有尺寸
        if (this.validateDimension(width) && this.validateDimension(height)) {
          await this.unifyToCustomSize(width, height);
        } else {
          new Notice("尺寸值必须在 50-2000 像素范围内");
        }
      } else if (width && !height) {
        // 只输入宽度：统一宽度，保持各自高度
        if (this.validateDimension(width)) {
          await this.unifyWidthOnly(width);
        } else {
          new Notice("宽度值必须在 50-2000 像素范围内");
        }
      } else if (!width && height) {
        // 只输入高度：统一高度，保持各自宽度
        if (this.validateDimension(height)) {
          await this.unifyHeightOnly(height);
        } else {
          new Notice("高度值必须在 50-2000 像素范围内");
        }
      } else {
        // 都没输入
        new Notice("请输入要调整的宽度和/或高度");
      }
    }
  }

  // 新增：只统一宽度的方法
  private async unifyWidthOnly(width: number): Promise<void> {
    try {
      await this.cardService.unifyCardWidth(this.cards, width);
    } catch (error) {
      console.error("统一宽度失败:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice("统一宽度失败: " + message);
    }
  }

  // 新增：只统一高度的方法
  private async unifyHeightOnly(height: number): Promise<void> {
    try {
      await this.cardService.unifyCardHeight(this.cards, height);
    } catch (error) {
      console.error("统一高度失败:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice("统一高度失败: " + message);
    }
  }

  private validateDimension(value: number): boolean {
    return validateDimension(value);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

