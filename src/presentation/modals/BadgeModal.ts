import { App, Modal } from 'obsidian';
import { BadgeData } from '../../domain/models/Badge';
import { IBadgeService } from '../../services/BadgeService';
import type { CanvasNode } from '../../types/canvas';

export class BadgeModal extends Modal {
    private currentBadge: string;
    private node: CanvasNode;
    private badgeService: IBadgeService;

    constructor(app: App, node: CanvasNode, badgeService: IBadgeService, currentBadge = '') {
        super(app);
        this.node = node;
        this.badgeService = badgeService;
        this.currentBadge = currentBadge;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "设置排序标记" });

        const inputContainer = contentEl.createDiv();
        inputContainer.addClass("canvas-loom-badge-input-container");
        inputContainer.createEl("label", { text: "排序标记（仅支持数字）：" });

        const input = inputContainer.createEl("input", {
            type: "text",
            value: this.currentBadge,
            placeholder: "例如：1、2.1、10.3.2"
        });
        input.addClass("canvas-loom-badge-input");

        const hint = contentEl.createDiv({ cls: "canvas-loom-badge-hint" });
        hint.setText("提示：排序标记会自动保存在画布文件中");

        const validation = contentEl.createDiv({ cls: "canvas-loom-badge-validation" });

        const buttonContainer = contentEl.createDiv({ cls: "canvas-loom-badge-actions" });

        const removeButton = buttonContainer.createEl("button", { text: "移除标记" });
        removeButton.addEventListener("click", () => {
            void this.setBadge("").then(() => {
                this.close();
            });
        });

        const cancelButton = buttonContainer.createEl("button", { text: "取消" });
        cancelButton.addEventListener("click", () => {
            this.close();
        });

        const confirmButton = buttonContainer.createEl("button", { text: "确定" });
        confirmButton.addClass("mod-cta");
        confirmButton.addEventListener("click", () => {
            if (!this.validateInput(input.value, validation, confirmButton)) {
                return;
            }

            void this.setBadge(input.value.trim()).then(() => {
                this.close();
            });
        });

        input.addEventListener("input", () => {
            this.validateInput(input.value, validation, confirmButton);
        });

        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                if (!this.validateInput(input.value, validation, confirmButton)) {
                    return;
                }

                void this.setBadge(input.value.trim()).then(() => {
                    this.close();
                });
            }
        });

        this.validateInput(input.value, validation, confirmButton);
        input.focus();
        input.select();
    }

    private validateInput(inputValue: string, validationEl: HTMLElement, confirmButton: HTMLButtonElement): boolean {
        const value = inputValue.trim();
        validationEl.removeClass("is-error");
        validationEl.removeClass("is-muted");

        if (!value) {
            validationEl.addClass("is-muted");
            validationEl.setText("留空可移除，或直接使用“移除标记”。");
            confirmButton.disabled = false;
            return true;
        }

        if (BadgeData.isValidContent(value)) {
            validationEl.addClass("is-muted");
            validationEl.setText("支持层级序号，例如 1、2.1、10.3.2。");
            confirmButton.disabled = false;
            return true;
        }

        validationEl.addClass("is-error");
        validationEl.setText("只支持数字序号，格式如 1、2、2.1。");
        confirmButton.disabled = true;
        return false;
    }

    private async setBadge(badgeText: string): Promise<void> {
        try {
            if (badgeText) {
                await this.badgeService.setBadge(this.node, badgeText);
            } else {
                await this.badgeService.removeBadge(this.node);
            }
        } catch (error) {
            console.error("设置标记时出错:", error);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
