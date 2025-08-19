import { Modal, Notice } from "obsidian";
import { CardService } from "../../services/CardService";

export class SingleCardPropertiesModal extends Modal {
  private card: any;
  private cardService: CardService;
  private cardData: any;

  constructor(app: any, card: any, cardService: CardService) {
    super(app);
    this.card = card;
    this.cardService = cardService;
    this.cardData = card.getData();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // 简洁的标题
    contentEl.createEl("h2", { text: "编辑卡片尺寸" });
    
    // 当前尺寸信息 - 简洁显示
    const currentInfoDiv = contentEl.createDiv({ cls: "current-card-info" });
    currentInfoDiv.innerHTML = `
      <div class="card-summary">
        <div class="size-display">
          <span class="size-label">当前尺寸：</span>
          <span class="size-value" id="current-size">${this.cardData.width} × ${this.cardData.height} px</span>
        </div>
        <div class="position-display">
          <span class="pos-label">位置：</span>
          <span class="pos-value">X: ${this.cardData.x}, Y: ${this.cardData.y}</span>
        </div>
      </div>
    `;

    // 内容预览（如果有文本）
    if (this.cardData.text) {
      const previewDiv = contentEl.createDiv({ cls: "content-preview" });
      const previewText = this.cardData.text.length > 100 
        ? this.cardData.text.substring(0, 100) + "..." 
        : this.cardData.text;
      previewDiv.innerHTML = `
        <div class="preview-label">内容预览：</div>
        <div class="preview-text">${previewText}</div>
      `;
    }

    contentEl.createEl("hr");

    // 尺寸编辑区域
    this.createDimensionEditor(contentEl);
    
    this.addStyles();
  }

  private createDimensionEditor(container: HTMLElement): void {
    const editorDiv = container.createDiv({ cls: "dimension-editor" });
    
    // 宽度编辑
    const widthSection = editorDiv.createDiv({ cls: "dimension-section" });
    const widthLabel = widthSection.createEl("label", { text: "宽度 (px)" });
    
    const widthControls = widthSection.createDiv({ cls: "dimension-controls" });
    const widthInput = widthControls.createEl("input", {
      type: "number",
      value: this.cardData.width.toString(),
      attr: { min: "50", max: "2000", step: "10" }
    });
    
    const widthButtons = widthControls.createDiv({ cls: "dimension-buttons" });
    const applyWidthBtn = widthButtons.createEl("button", { text: "应用", cls: "mod-cta mod-small" });
    const resetWidthBtn = widthButtons.createEl("button", { text: "重置", cls: "mod-small" });
    
    // 高度编辑
    const heightSection = editorDiv.createDiv({ cls: "dimension-section" });
    const heightLabel = heightSection.createEl("label", { text: "高度 (px)" });
    
    const heightControls = heightSection.createDiv({ cls: "dimension-controls" });
    const heightInput = heightControls.createEl("input", {
      type: "number", 
      value: this.cardData.height.toString(),
      attr: { min: "50", max: "2000", step: "10" }
    });
    
    const heightButtons = heightControls.createDiv({ cls: "dimension-buttons" });
    const applyHeightBtn = heightButtons.createEl("button", { text: "应用", cls: "mod-cta mod-small" });
    const resetHeightBtn = heightButtons.createEl("button", { text: "重置", cls: "mod-small" });
    
    // 同时应用按钮
    const applyBothDiv = editorDiv.createDiv({ cls: "apply-both-section" });
    const applyBothBtn = applyBothDiv.createEl("button", {
      text: "应用宽度和高度",
      cls: "mod-cta apply-both-btn"
    });

    // 事件处理
    applyWidthBtn.addEventListener("click", async () => {
      const width = parseInt(widthInput.value);
      if (this.validateDimension(width)) {
        await this.updateDimension("width", width);
      }
    });

    applyHeightBtn.addEventListener("click", async () => {
      const height = parseInt(heightInput.value);
      if (this.validateDimension(height)) {
        await this.updateDimension("height", height);
      }
    });

    applyBothBtn.addEventListener("click", async () => {
      const width = parseInt(widthInput.value);
      const height = parseInt(heightInput.value);
      if (this.validateDimension(width) && this.validateDimension(height)) {
        await this.updateBothDimensions(width, height);
      }
    });

    resetWidthBtn.addEventListener("click", () => {
      widthInput.value = this.cardData.width.toString();
    });

    resetHeightBtn.addEventListener("click", () => {
      heightInput.value = this.cardData.height.toString();
    });

    // 键盘支持
    [widthInput, heightInput].forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyBothBtn.click();
        }
      });
    });
  }

  private async updateDimension(dimension: string, value: number): Promise<void> {
    try {
      const newWidth = dimension === "width" ? value : this.cardData.width;
      const newHeight = dimension === "height" ? value : this.cardData.height;
      
      await this.cardService.unifyCardSizes([this.card], { width: newWidth, height: newHeight });
      
      // 更新本地数据和显示
      this.cardData.width = newWidth;
      this.cardData.height = newHeight;
      this.updateSizeDisplay();
      
      new Notice(`卡片${dimension === "width" ? "宽度" : "高度"}已更新为 ${value}px`);
      
    } catch (error) {
      console.error("更新尺寸失败:", error);
      new Notice("更新失败: " + error.message);
    }
  }

  private async updateBothDimensions(width: number, height: number): Promise<void> {
    try {
      await this.cardService.unifyCardSizes([this.card], { width, height });
      
      this.cardData.width = width;
      this.cardData.height = height;
      this.updateSizeDisplay();
      
      new Notice(`卡片尺寸已更新为 ${width}×${height}px`);
      this.close();
      
    } catch (error) {
      console.error("更新尺寸失败:", error);
      new Notice("更新失败: " + error.message);
    }
  }

  private updateSizeDisplay(): void {
    const sizeEl = this.contentEl.querySelector("#current-size");
    if (sizeEl) {
      sizeEl.textContent = `${this.cardData.width} × ${this.cardData.height} px`;
    }
  }

  private validateDimension(value: number): boolean {
    return !isNaN(value) && value >= 50 && value <= 2000;
  }

  private addStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .current-card-info {
        background-color: var(--background-secondary);
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      
      .card-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .size-display, .position-display {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .size-label, .pos-label {
        color: var(--text-muted);
        font-size: 0.9em;
      }
      
      .size-value {
        font-weight: bold;
        color: var(--text-accent);
        font-size: 1.1em;
      }
      
      .content-preview {
        margin-bottom: 15px;
        padding: 10px;
        background-color: var(--background-secondary);
        border-radius: 3px;
      }
      
      .preview-label {
        font-size: 0.9em;
        color: var(--text-muted);
        margin-bottom: 5px;
      }
      
      .preview-text {
        font-size: 0.95em;
        line-height: 1.4;
      }
      
      .dimension-editor {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .dimension-section {
        padding: 15px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
      }
      
      .dimension-section label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
      }
      
      .dimension-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .dimension-controls input {
        width: 120px;
        padding: 5px 8px;
      }
      
      .dimension-buttons {
        display: flex;
        gap: 5px;
      }
      
      .apply-both-section {
        text-align: center;
        padding-top: 15px;
        border-top: 1px solid var(--background-modifier-border);
      }
      
      .apply-both-btn {
        padding: 10px 30px;
        font-size: 1em;
      }
      
      .mod-small {
        padding: 4px 12px;
        font-size: 0.9em;
      }
    `;
    document.head.appendChild(style);
    
    this.scope.register([], "cleanup-style", () => {
      style.remove();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}