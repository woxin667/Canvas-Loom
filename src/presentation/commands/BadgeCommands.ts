import type { CanvasNode } from "../../types/canvas";
import { ICommand } from "./ICommand";

export class OpenBadgeModalCommand implements ICommand {
    constructor(
        private openModal: (node: CanvasNode) => Promise<void>,
        private node: CanvasNode
    ) {}

    async execute(): Promise<void> {
        await this.openModal(this.node);
    }

    canExecute(): boolean {
        return true; // 模态框本身会处理验证
    }

    getDescription(): string {
        return "编辑标记";
    }
}
