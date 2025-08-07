import { Notice } from 'obsidian';

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 复制是否成功
 */
export async function copyTextToClipboard(text: string, noticeMessage?: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        new Notice(noticeMessage || '卡片内容已复制到剪贴板');
        return true;
    } catch (err) {
        console.error('复制到剪贴板失败:', err);
        new Notice('复制到剪贴板失败: ' + (err as Error).message);
        return false;
    }
}